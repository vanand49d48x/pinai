import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPinSchema } from "@/lib/validations";
import {
  BillingLimitError,
  incrementUsage,
  limitErrorResponse,
  requireWithinLimits,
} from "@/lib/billing";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status");

  let query = supabase
    .from("pins")
    .select("*, boards(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pins: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createPinSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await requireWithinLimits(user.id, "create_pin");
  } catch (err) {
    if (err instanceof BillingLimitError) return limitErrorResponse(err);
    throw err;
  }

  const { scheduled_at, ...pinData } = parsed.data;
  const status = scheduled_at ? "scheduled" : "draft";

  const { data, error } = await supabase
    .from("pins")
    .insert({
      user_id: user.id,
      ...pinData,
      scheduled_at: scheduled_at ?? null,
      status,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await incrementUsage(user.id, "pins_created");

  return NextResponse.json({ pin: data }, { status: 201 });
}
