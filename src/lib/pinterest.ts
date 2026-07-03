import { decrypt, encrypt } from "@/lib/encryption";
import { createServiceClient } from "@/lib/supabase/service";
import type { PinterestAccount } from "@/types/database";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const SANDBOX_REFRESH_PLACEHOLDER = "sandbox-no-refresh";

function isSandboxApi(): boolean {
  return (process.env.PINTEREST_API_BASE || "").includes("sandbox");
}

function getPinterestApiBase(): string {
  return process.env.PINTEREST_API_BASE || "https://api.pinterest.com";
}

function parsePinterestApiError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { code?: number; message?: string };
    if (parsed.code === 3) {
      return (
        "Pinterest app is not approved for Trial access yet. " +
        "Go to developers.pinterest.com → My apps → request Trial access " +
        "(requires privacy policy URL). Then regenerate your sandbox token."
      );
    }
    if (parsed.message) {
      return `Pinterest API error (${status}): ${parsed.message}`;
    }
  } catch {
    // fall through
  }
  return `Pinterest API error (${status}): ${body}`;
}

async function readPinterestError(response: Response): Promise<string> {
  const body = await response.text();
  return parsePinterestApiError(response.status, body);
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
  const refreshToken = decrypt(account.refresh_token);

  if (refreshToken === SANDBOX_REFRESH_PLACEHOLDER) {
    return decrypt(account.access_token);
  }

  const expiresAt = new Date(account.token_expires_at).getTime();
  const now = Date.now();

  if (expiresAt - now > TOKEN_REFRESH_BUFFER_MS) {
    return decrypt(account.access_token);
  }

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
    throw new Error(await readPinterestError(response));
  }

  return response.json() as Promise<{ username?: string }>;
}

export async function syncBoards(userId: string, accessToken: string) {
  const response = await fetch(`${getPinterestApiBase()}/v5/boards`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(await readPinterestError(response));
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

export async function connectSandboxAccount(userId: string) {
  const accessToken = process.env.PINTEREST_SANDBOX_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("PINTEREST_SANDBOX_ACCESS_TOKEN is not configured");
  }

  if (!isSandboxApi()) {
    throw new Error("Sandbox token connect requires PINTEREST_API_BASE sandbox URL");
  }

  const tokenExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  let username = "sandbox";

  try {
    const pinterestUser = await getPinterestUser(accessToken);
    username = pinterestUser.username ?? "sandbox";
  } catch {
    // Sandbox tokens often cannot call user_account before Trial approval.
  }

  const supabase = createServiceClient();
  await supabase.from("pinterest_accounts").upsert(
    {
      user_id: userId,
      access_token: encrypt(accessToken),
      refresh_token: encrypt(SANDBOX_REFRESH_PLACEHOLDER),
      token_expires_at: tokenExpiresAt,
      pinterest_username: username,
    },
    { onConflict: "user_id" }
  );

  const boardCount = await syncBoards(userId, accessToken);
  return { username, boardCount };
}

export function isSandboxTokenConfigured(): boolean {
  return Boolean(process.env.PINTEREST_SANDBOX_ACCESS_TOKEN) && isSandboxApi();
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

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      const error = new Error("Rate limited by Pinterest");
      (error as Error & { isRateLimit: boolean }).isRateLimit = true;
      throw error;
    }
    throw new Error(parsePinterestApiError(response.status, errorText));
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
