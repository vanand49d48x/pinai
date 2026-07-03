import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { planFromPriceId, type PlanId } from "@/lib/plans";
import { getSubscriptionPeriodEnd } from "@/lib/stripe-subscription";

function mapStripeStatus(
  status: Stripe.Subscription.Status
): "active" | "past_due" | "canceled" | "trialing" {
  switch (status) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "trialing":
      return "trialing";
    default:
      return "active";
  }
}

export async function syncSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  userId?: string
) {
  const supabase = createServiceClient();
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  let resolvedUserId = userId ?? subscription.metadata.user_id;

  if (!resolvedUserId) {
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    resolvedUserId = existing?.user_id;
  }

  if (!resolvedUserId) return;

  const priceId = subscription.items.data[0]?.price.id;
  const plan: PlanId = (priceId && planFromPriceId(priceId)) || "free";
  const status = mapStripeStatus(subscription.status);
  const currentPeriodEnd = getSubscriptionPeriodEnd(subscription);

  await supabase.from("subscriptions").upsert(
    {
      user_id: resolvedUserId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan: status === "canceled" ? "free" : plan,
      status,
      current_period_end: currentPeriodEnd,
    },
    { onConflict: "user_id" }
  );
}

export async function findUserIdByCustomer(customerId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

export async function getUserEmail(userId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}
