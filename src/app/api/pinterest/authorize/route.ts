import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPinterestAuthorizeUrl } from "@/lib/pinterest";
import { randomBytes } from "crypto";
import { BillingLimitError, limitErrorResponse, requireWithinLimits } from "@/lib/billing";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireWithinLimits(user.id, "connect_pinterest");
  } catch (err) {
    if (err instanceof BillingLimitError) {
      return limitErrorResponse(err);
    }
    throw err;
  }

  const state = randomBytes(32).toString("hex");

  const response = NextResponse.redirect(getPinterestAuthorizeUrl(state));
  response.cookies.set("pinterest_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
