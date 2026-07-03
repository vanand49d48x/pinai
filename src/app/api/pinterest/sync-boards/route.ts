import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken, syncBoards } from "@/lib/pinterest";
import type { PinterestAccount } from "@/types/database";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: account, error: accountError } = await supabase
    .from("pinterest_accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (accountError || !account) {
    return NextResponse.json(
      { error: "Pinterest account not connected" },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getValidAccessToken(account as PinterestAccount);
    const count = await syncBoards(user.id, accessToken);
    return NextResponse.json({ synced: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
