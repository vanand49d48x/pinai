export const APP_NAME = "PinAI";
export const APP_TAGLINE = "AI writes your Pinterest SEO. You just pick the time.";
export const APP_DESCRIPTION =
  "Generate Pinterest titles, descriptions, and alt text from your images with AI, then auto-publish on schedule.";
export const SUPPORT_EMAIL = "support@pinai.app";
export const COMPANY_NAME = "[Your Company Name]";

export function pageTitle(segment?: string): string {
  return segment ? `${segment} — ${APP_NAME}` : `${APP_NAME} — ${APP_TAGLINE}`;
}

export function appUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  return `${base}${path}`;
}
