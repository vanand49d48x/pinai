export type PlanId = "free" | "starter" | "pro";

export interface PlanLimits {
  maxAccounts: number;
  maxPinsPerMonth: number;
  maxAiPerMonth: number;
  bulkCsv: boolean;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxAccounts: 1,
    maxPinsPerMonth: 15,
    maxAiPerMonth: 15,
    bulkCsv: false,
  },
  starter: {
    maxAccounts: 2,
    maxPinsPerMonth: 200,
    maxAiPerMonth: 200,
    bulkCsv: false,
  },
  pro: {
    maxAccounts: 5,
    maxPinsPerMonth: 2000,
    maxAiPerMonth: 1000,
    bulkCsv: true,
  },
};

export const PLAN_PRICES = {
  starter: { month: 12, year: 120 },
  pro: { month: 29, year: 290 },
} as const;

export type LimitAction = "create_pin" | "generate_ai" | "connect_pinterest" | "bulk_csv";

export type LimitCode =
  | "LIMIT_PINS"
  | "LIMIT_AI"
  | "LIMIT_ACCOUNTS"
  | "LIMIT_BULK"
  | "PAST_DUE";

export interface LimitCheckInput {
  plan: PlanId;
  status: "active" | "past_due" | "canceled" | "trialing";
  pinsCreated: number;
  aiGenerations: number;
  accountCount: number;
  action: LimitAction;
  bulkCount?: number;
}

export interface LimitCheckResult {
  allowed: boolean;
  code?: LimitCode;
  message?: string;
}

export function checkWithinLimits(input: LimitCheckInput): LimitCheckResult {
  const limits = PLAN_LIMITS[input.plan];

  if (input.status === "past_due") {
    return {
      allowed: false,
      code: "PAST_DUE",
      message: "Payment failed. Update your card to continue.",
    };
  }

  if (input.action === "bulk_csv" && !limits.bulkCsv) {
    return {
      allowed: false,
      code: "LIMIT_BULK",
      message: "Bulk CSV import requires the Pro plan.",
    };
  }

  if (input.action === "connect_pinterest") {
    if (input.accountCount >= limits.maxAccounts) {
      return {
        allowed: false,
        code: "LIMIT_ACCOUNTS",
        message: `Your ${input.plan} plan allows ${limits.maxAccounts} Pinterest account(s).`,
      };
    }
  }

  if (input.action === "create_pin" || input.action === "bulk_csv") {
    const add = input.bulkCount ?? 1;
    if (input.pinsCreated + add > limits.maxPinsPerMonth) {
      return {
        allowed: false,
        code: "LIMIT_PINS",
        message: `Pin limit reached (${limits.maxPinsPerMonth}/month on ${input.plan}).`,
      };
    }
  }

  if (input.action === "generate_ai") {
    if (input.aiGenerations >= limits.maxAiPerMonth) {
      return {
        allowed: false,
        code: "LIMIT_AI",
        message: `AI generation limit reached (${limits.maxAiPerMonth}/month on ${input.plan}).`,
      };
    }
  }

  return { allowed: true };
}

export function planFromPriceId(priceId: string): PlanId | null {
  const map: Record<string, PlanId> = {};
  if (process.env.STRIPE_PRICE_STARTER) map[process.env.STRIPE_PRICE_STARTER] = "starter";
  if (process.env.STRIPE_PRICE_PRO) map[process.env.STRIPE_PRICE_PRO] = "pro";
  if (process.env.STRIPE_PRICE_STARTER_YEARLY) map[process.env.STRIPE_PRICE_STARTER_YEARLY] = "starter";
  if (process.env.STRIPE_PRICE_PRO_YEARLY) map[process.env.STRIPE_PRICE_PRO_YEARLY] = "pro";
  return map[priceId] ?? null;
}

export function getUsageWarningThreshold(plan: PlanId, field: "pins" | "ai"): number {
  const limits = PLAN_LIMITS[plan];
  const max = field === "pins" ? limits.maxPinsPerMonth : limits.maxAiPerMonth;
  return Math.floor(max * 0.8);
}
