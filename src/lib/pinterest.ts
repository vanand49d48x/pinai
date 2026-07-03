import { decrypt, encrypt } from "@/lib/encryption";
import { createServiceClient } from "@/lib/supabase/service";
import type { PinterestAccount } from "@/types/database";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

function getPinterestApiBase(): string {
  return process.env.PINTEREST_API_BASE || "https://api.pinterest.com";
}

function getBasicAuthHeader(): string {
  const clientId = process.env.PINTEREST_CLIENT_ID!;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET!;
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

export function getPinterestAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.PINTEREST_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/pinterest/callback`,
    response_type: "code",
    scope: "boards:read,pins:read,pins:write",
    state,
  });
  return `https://www.pinterest.com/oauth/?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const response = await fetch(`${getPinterestApiBase()}/v5/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/pinterest/callback`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_token_expires_in?: number;
  }>;
}

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(`${getPinterestApiBase()}/v5/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>;
}

export async function getValidAccessToken(
  account: PinterestAccount
): Promise<string> {
  const expiresAt = new Date(account.token_expires_at).getTime();
  const now = Date.now();

  if (expiresAt - now > TOKEN_REFRESH_BUFFER_MS) {
    return decrypt(account.access_token);
  }

  const refreshToken = decrypt(account.refresh_token);
  const tokens = await refreshAccessToken(refreshToken);

  const newExpiresAt = new Date(
    Date.now() + tokens.expires_in * 1000
  ).toISOString();

  const supabase = createServiceClient();
  await supabase
    .from("pinterest_accounts")
    .update({
      access_token: encrypt(tokens.access_token),
      refresh_token: encrypt(tokens.refresh_token),
      token_expires_at: newExpiresAt,
    })
    .eq("id", account.id);

  return tokens.access_token;
}

export async function getPinterestUser(accessToken: string) {
  const response = await fetch(`${getPinterestApiBase()}/v5/user_account`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Pinterest user: ${await response.text()}`);
  }

  return response.json() as Promise<{ username?: string }>;
}

export async function syncBoards(userId: string, accessToken: string) {
  const response = await fetch(`${getPinterestApiBase()}/v5/boards`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch boards: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    items: Array<{ id: string; name: string }>;
  };

  const supabase = createServiceClient();

  for (const board of data.items) {
    await supabase.from("boards").upsert(
      {
        user_id: userId,
        pinterest_board_id: board.id,
        name: board.name,
      },
      { onConflict: "user_id,pinterest_board_id" }
    );
  }

  return data.items.length;
}

export interface PublishPinInput {
  boardId: string;
  title: string;
  description: string;
  altText: string;
  link: string | null;
  imageUrl: string;
}

export async function publishPinToPinterest(
  accessToken: string,
  input: PublishPinInput
): Promise<{ id: string }> {
  const body: Record<string, unknown> = {
    board_id: input.boardId,
    title: input.title.slice(0, 100),
    description: input.description.slice(0, 500),
    alt_text: input.altText.slice(0, 500),
    media_source: {
      source_type: "image_url",
      url: input.imageUrl,
    },
  };

  if (input.link) {
    body.link = input.link;
  }

  const response = await fetch(`${getPinterestApiBase()}/v5/pins`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    const error = new Error("Rate limited by Pinterest");
    (error as Error & { isRateLimit: boolean }).isRateLimit = true;
    throw error;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinterest publish failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<{ id: string }>;
}

export class PinterestRateLimitError extends Error {
  constructor() {
    super("Rate limited by Pinterest");
    this.name = "PinterestRateLimitError";
  }
}

export function isRateLimitError(error: unknown): boolean {
  if (error instanceof PinterestRateLimitError) return true;
  if (error instanceof Error && "isRateLimit" in error) {
    return (error as Error & { isRateLimit: boolean }).isRateLimit === true;
  }
  return false;
}

export { encrypt };
