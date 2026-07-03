import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe";
import type { PlanId } from "@/lib/plans";
import {
  findUserIdByCustomer,
  getUserEmail,
  syncSubscriptionFromStripe,
} from "@/lib/stripe-sync";
import { getSubscriptionPeriodEnd } from "@/lib/stripe-subscription";
import {
  sendPaymentFailedEmail,
  sendSubscriptionCanceledEmail,
} from "@/lib/emails";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;

      if (userId && customerId) {
        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id:
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription?.id ?? null,
            plan: (session.metadata?.plan as PlanId) ?? "starter",
            status: "active",
          },
          { onConflict: "user_id" }
        );
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionFromStripe(subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
      const userId = await findUserIdByCustomer(customerId);

      if (userId) {
        await supabase
          .from("subscriptions")
          .update({
            plan: "free",
            status: "canceled",
            stripe_subscription_id: null,
            current_period_end: getSubscriptionPeriodEnd(subscription),
          })
          .eq("user_id", userId);

        const email = await getUserEmail(userId);
        if (email) await sendSubscriptionCanceledEmail(email, "paid");
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;

      const userId = await findUserIdByCustomer(customerId);
      if (userId) {
        await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("user_id", userId);

        const email = await getUserEmail(userId);
        if (email) await sendPaymentFailedEmail(email);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
