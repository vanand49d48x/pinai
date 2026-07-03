import { describe, expect, it } from "vitest";
import { checkWithinLimits, PLAN_LIMITS } from "@/lib/plans";

const freeCtx = {
  plan: "free" as const,
  status: "active" as const,
  pinsCreated: 0,
  aiGenerations: 0,
  accountCount: 0,
};

describe("checkWithinLimits — free plan pin boundary", () => {
  it("allows the 15th pin (at limit, not over)", () => {
    const result = checkWithinLimits({
      ...freeCtx,
      pinsCreated: 14,
      action: "create_pin",
    });
    expect(result.allowed).toBe(true);
  });

  it("blocks the 16th pin", () => {
    const result = checkWithinLimits({
      ...freeCtx,
      pinsCreated: PLAN_LIMITS.free.maxPinsPerMonth,
      action: "create_pin",
    });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("LIMIT_PINS");
  });

  it("blocks bulk import on free", () => {
    const result = checkWithinLimits({
      ...freeCtx,
      action: "bulk_csv",
      bulkCount: 1,
    });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("LIMIT_BULK");
  });
});

describe("checkWithinLimits — past_due", () => {
  it("blocks all mutating actions when past_due", () => {
    for (const action of ["create_pin", "generate_ai", "connect_pinterest", "bulk_csv"] as const) {
      const result = checkWithinLimits({
        ...freeCtx,
        status: "past_due",
        action,
      });
      expect(result.allowed).toBe(false);
      expect(result.code).toBe("PAST_DUE");
    }
  });
});

describe("checkWithinLimits — AI generations", () => {
  it("allows generation at limit minus one", () => {
    const result = checkWithinLimits({
      ...freeCtx,
      aiGenerations: PLAN_LIMITS.free.maxAiPerMonth - 1,
      action: "generate_ai",
    });
    expect(result.allowed).toBe(true);
  });

  it("blocks when at AI limit", () => {
    const result = checkWithinLimits({
      ...freeCtx,
      aiGenerations: PLAN_LIMITS.free.maxAiPerMonth,
      action: "generate_ai",
    });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("LIMIT_AI");
  });
});
