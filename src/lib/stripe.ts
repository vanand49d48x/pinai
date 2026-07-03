import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function getPriceId(plan: "starter" | "pro", interval: "month" | "year"): string {
  const envKey =
    plan === "starter"
      ? interval === "year"
        ? "STRIPE_PRICE_STARTER_YEARLY"
        : "STRIPE_PRICE_STARTER"
      : interval === "year"
        ? "STRIPE_PRICE_PRO_YEARLY"
        : "STRIPE_PRICE_PRO";

  const priceId = process.env[envKey];
  if (!priceId) throw new Error(`${envKey} is not configured`);
  return priceId;
}
