import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserBillingContext } from "@/lib/billing";
import { PLAN_LIMITS } from "@/lib/plans";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await getUserBillingContext(user.id);
  const limits = PLAN_LIMITS[ctx.plan];

  return NextResponse.json({
    plan: ctx.plan,
    status: ctx.status,
    currentPeriodEnd: ctx.currentPeriodEnd,
    usage: {
      pinsCreated: ctx.pinsCreated,
      aiGenerations: ctx.aiGenerations,
      maxPins: limits.maxPinsPerMonth,
      maxAi: limits.maxAiPerMonth,
      maxAccounts: limits.maxAccounts,
      bulkCsv: limits.bulkCsv,
    },
  });
}
