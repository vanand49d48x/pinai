import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  checkWithinLimits,
  getUsageWarningThreshold,
  type LimitAction,
  type LimitCode,
  type PlanId,
  PLAN_LIMITS,
} from "@/lib/plans";
import {
  sendApproachingLimitEmail,
} from "@/lib/emails";

export class BillingLimitError extends Error {
  constructor(
    public code: LimitCode,
    message: string
  ) {
    super(message);
    this.name = "BillingLimitError";
  }
}

export function limitErrorResponse(error: BillingLimitError) {
  return NextResponse.json(
    { error: error.message, code: error.code },
    { status: 402 }
  );
}

function currentPeriodStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

export interface UserBillingContext {
  plan: PlanId;
  status: "active" | "past_due" | "canceled" | "trialing";
  pinsCreated: number;
  aiGenerations: number;
  accountCount: number;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
}

export async function getUserBillingContext(userId: string): Promise<UserBillingContext> {
  const supabase = createServiceClient();
  const period = currentPeriodStart();

  const [{ data: sub }, { data: usage }, { count: accountCount }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("usage_counters")
      .select("*")
      .eq("user_id", userId)
      .eq("period_start", period)
      .maybeSingle(),
    supabase
      .from("pinterest_accounts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (!sub) {
    await supabase.from("subscriptions").insert({
      user_id: userId,
      plan: "free",
      status: "active",
    });
  }

  return {
    plan: (sub?.plan as PlanId) ?? "free",
    status: sub?.status ?? "active",
    pinsCreated: usage?.pins_created ?? 0,
    aiGenerations: usage?.ai_generations ?? 0,
    accountCount: accountCount ?? 0,
    currentPeriodEnd: sub?.current_period_end ?? null,
    stripeCustomerId: sub?.stripe_customer_id ?? null,
  };
}

const ACTION_MAP: Record<LimitAction, Parameters<typeof checkWithinLimits>[0]["action"]> = {
  create_pin: "create_pin",
  generate_ai: "generate_ai",
  connect_pinterest: "connect_pinterest",
  bulk_csv: "bulk_csv",
};

export async function requireWithinLimits(
  userId: string,
  action: LimitAction,
  options?: { bulkCount?: number }
): Promise<UserBillingContext> {
  const ctx = await getUserBillingContext(userId);

  const result = checkWithinLimits({
    plan: ctx.plan,
    status: ctx.status,
    pinsCreated: ctx.pinsCreated,
    aiGenerations: ctx.aiGenerations,
    accountCount: ctx.accountCount,
    action: ACTION_MAP[action],
    bulkCount: options?.bulkCount,
  });

  if (!result.allowed && result.code) {
    throw new BillingLimitError(result.code, result.message ?? "Plan limit reached");
  }

  return ctx;
}

export async function incrementUsage(
  userId: string,
  field: "pins_created" | "ai_generations",
  amount = 1
) {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("increment_usage", {
    p_user_id: userId,
    p_field: field,
    p_amount: amount,
  });

  if (error) throw new Error(error.message);

  const ctx = await getUserBillingContext(userId);
  const counter = data as {
    pins_created: number;
    ai_generations: number;
    pins_warning_sent: boolean;
    ai_warning_sent: boolean;
  };

  await maybeSendLimitWarning(userId, ctx, counter, field);

  return counter;
}

async function maybeSendLimitWarning(
  userId: string,
  ctx: UserBillingContext,
  counter: { pins_created: number; ai_generations: number; pins_warning_sent: boolean; ai_warning_sent: boolean },
  field: "pins_created" | "ai_generations"
) {
  const supabase = createServiceClient();
  const { data: user } = await supabase.auth.admin.getUserById(userId);
  const email = user?.user?.email;
  if (!email) return;

  const period = currentPeriodStart();
  const limits = PLAN_LIMITS[ctx.plan];

  if (field === "pins_created" && !counter.pins_warning_sent) {
    const threshold = getUsageWarningThreshold(ctx.plan, "pins");
    if (counter.pins_created >= threshold) {
      await sendApproachingLimitEmail(email, "pins", counter.pins_created, limits.maxPinsPerMonth);
      await supabase
        .from("usage_counters")
        .update({ pins_warning_sent: true })
        .eq("user_id", userId)
        .eq("period_start", period);
    }
  }

  if (field === "ai_generations" && !counter.ai_warning_sent) {
    const threshold = getUsageWarningThreshold(ctx.plan, "ai");
    if (counter.ai_generations >= threshold) {
      await sendApproachingLimitEmail(email, "ai", counter.ai_generations, limits.maxAiPerMonth);
      await supabase
        .from("usage_counters")
        .update({ ai_warning_sent: true })
        .eq("user_id", userId)
        .eq("period_start", period);
    }
  }
}

export function isPublishingBlocked(
  status: string,
  currentPeriodEnd: string | null
): boolean {
  if (status !== "canceled") return false;
  if (!currentPeriodEnd) return true;
  return new Date(currentPeriodEnd) < new Date();
}
