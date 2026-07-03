import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  encrypt,
  exchangeCodeForTokens,
  getPinterestUser,
  syncBoards,
} from "@/lib/pinterest";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const settingsUrl = `${appUrl}/settings`;

  if (error) {
    return NextResponse.redirect(`${settingsUrl}?error=${encodeURIComponent(error)}`);
  }

  const storedState = request.cookies.get("pinterest_oauth_state")?.value;
  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${settingsUrl}?error=invalid_state`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const accessToken = tokens.access_token;
    const pinterestUser = await getPinterestUser(accessToken);

    const tokenExpiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    await supabase.from("pinterest_accounts").upsert(
      {
        user_id: user.id,
        access_token: encrypt(tokens.access_token),
        refresh_token: encrypt(tokens.refresh_token),
        token_expires_at: tokenExpiresAt,
        pinterest_username: pinterestUser.username ?? null,
      },
      { onConflict: "user_id" }
    );

    await syncBoards(user.id, accessToken);

    const response = NextResponse.redirect(`${settingsUrl}?connected=true`);
    response.cookies.delete("pinterest_oauth_state");
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.redirect(
      `${settingsUrl}?error=${encodeURIComponent(message)}`
    );
  }
}
