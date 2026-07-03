import { Resend } from "resend";
import { APP_NAME } from "@/lib/brand";
import { appUrl } from "@/lib/brand";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

const FROM = `${APP_NAME} <billing@${process.env.RESEND_FROM_DOMAIN ?? "pinai.app"}>`;

export async function sendPaymentFailedEmail(to: string) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Payment failed — update your ${APP_NAME} subscription`,
    html: `<p>Your recent payment failed. <a href="${appUrl("/settings/billing")}">Update your payment method</a> to keep scheduling pins.</p>`,
  });
}

export async function sendApproachingLimitEmail(
  to: string,
  type: "pins" | "ai",
  used: number,
  max: number
) {
  const resend = getResend();
  if (!resend) return;

  const label = type === "pins" ? "pin creations" : "AI generations";
  await resend.emails.send({
    from: FROM,
    to,
    subject: `You're approaching your ${APP_NAME} ${label} limit`,
    html: `<p>You've used ${used} of ${max} ${label} this month. <a href="${appUrl("/settings/billing")}">Upgrade your plan</a> for more.</p>`,
  });
}

export async function sendSubscriptionCanceledEmail(to: string, plan: string) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your ${APP_NAME} subscription was canceled`,
    html: `<p>Your ${plan} subscription has been canceled. You're now on the Free plan. Existing pins are safe — <a href="${appUrl("/settings/billing")}">resubscribe anytime</a>.</p>`,
  });
}
