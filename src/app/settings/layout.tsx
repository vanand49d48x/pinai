import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata("Settings");

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
