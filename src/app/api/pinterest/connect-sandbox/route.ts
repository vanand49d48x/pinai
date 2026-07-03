import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { connectSandboxAccount, isSandboxTokenConfigured } from "@/lib/pinterest";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSandboxTokenConfigured()) {
    return NextResponse.json(
      { error: "PINTEREST_SANDBOX_ACCESS_TOKEN not configured for sandbox API" },
      { status: 400 }
    );
  }

  try {
    const result = await connectSandboxAccount(user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sandbox connect failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
