import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata("Calendar");

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
