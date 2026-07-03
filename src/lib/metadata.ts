import type { Metadata } from "next";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE, appUrl, pageTitle } from "@/lib/brand";

export function createMetadata(segment?: string, description = APP_DESCRIPTION): Metadata {
  const title = pageTitle(segment);
  const url = appUrl(segment ? `/${segment.toLowerCase()}` : "");

  return {
    title,
    description,
    applicationName: APP_NAME,
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    openGraph: {
      title,
      description,
      siteName: APP_NAME,
      type: "website",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    icons: {
      icon: "/icon.svg",
      apple: "/icon.svg",
    },
  };
}

export const rootMetadata: Metadata = {
  ...createMetadata(),
  title: {
    default: pageTitle(),
    template: `%s — ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  openGraph: {
    title: pageTitle(),
    description: APP_TAGLINE,
    siteName: APP_NAME,
    type: "website",
  },
};
