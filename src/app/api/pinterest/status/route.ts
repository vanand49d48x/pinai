import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSandboxTokenConfigured } from "@/lib/pinterest";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: account } = await supabase
    .from("pinterest_accounts")
    .select("id, pinterest_username, token_expires_at, created_at")
    .eq("user_id", user.id)
    .single();

  const { data: boards } = await supabase
    .from("boards")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  return NextResponse.json({
    account: account ?? null,
    boards: boards ?? [],
    sandboxConnectAvailable:
      process.env.NEXT_PUBLIC_ENABLE_SANDBOX === "true" && isSandboxTokenConfigured(),
  });
}
