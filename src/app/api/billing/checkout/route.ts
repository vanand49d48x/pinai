import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe, getPriceId } from "@/lib/stripe";
import { appUrl } from "@/lib/brand";

const checkoutSchema = z.object({
  plan: z.enum(["starter", "pro"]),
  interval: z.enum(["month", "year"]),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const stripe = getStripe();
  const service = createServiceClient();

  let { data: sub } = await service
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sub) {
    await service.from("subscriptions").insert({
      user_id: user.id,
      plan: "free",
      status: "active",
    });
    sub = { stripe_customer_id: null };
  }

  let customerId = sub.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await service
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user.id);
  }

  const priceId = getPriceId(parsed.data.plan, parsed.data.interval);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl("/dashboard")}?upgraded=1`,
    cancel_url: appUrl("/settings/billing"),
    metadata: { user_id: user.id, plan: parsed.data.plan },
    subscription_data: {
      metadata: { user_id: user.id, plan: parsed.data.plan },
    },
  });

  return NextResponse.json({ url: session.url });
}
