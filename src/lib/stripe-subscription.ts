import Stripe from "stripe";

/** Stripe v22+ stores period end on subscription items, not the subscription root. */
export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): string {
  const itemEnd = subscription.items.data[0]?.current_period_end;
  const fallback = subscription.canceled_at ?? subscription.ended_at;
  const unix = itemEnd ?? fallback ?? Math.floor(Date.now() / 1000);
  return new Date(unix * 1000).toISOString();
}
