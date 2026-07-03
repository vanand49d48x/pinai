import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { planFromPriceId } from "@/lib/plans";

describe("planFromPriceId — webhook plan sync", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    process.env.STRIPE_PRICE_STARTER = "price_starter_monthly";
    process.env.STRIPE_PRICE_PRO = "price_pro_monthly";
    process.env.STRIPE_PRICE_STARTER_YEARLY = "price_starter_yearly";
    process.env.STRIPE_PRICE_PRO_YEARLY = "price_pro_yearly";
  });

  afterEach(() => {
    process.env = env;
  });

  it("maps monthly starter price", () => {
    expect(planFromPriceId("price_starter_monthly")).toBe("starter");
  });

  it("maps yearly pro price", () => {
    expect(planFromPriceId("price_pro_yearly")).toBe("pro");
  });

  it("returns null for unknown price", () => {
    expect(planFromPriceId("price_unknown")).toBeNull();
  });
});
