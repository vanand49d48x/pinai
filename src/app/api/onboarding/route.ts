import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: account }, { count: pinCount }, { count: scheduledCount }] =
    await Promise.all([
      supabase
        .from("pinterest_accounts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("pins")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("pins")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("scheduled_at", "is", null),
    ]);

  return NextResponse.json({
    pinterestConnected: Boolean(account),
    hasPin: (pinCount ?? 0) > 0,
    hasScheduled: (scheduledCount ?? 0) > 0,
  });
}
