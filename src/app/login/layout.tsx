import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata("Sign in", "Sign in to PinAI to schedule Pinterest pins with AI.");

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
