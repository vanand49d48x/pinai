import { Suspense } from "react";
import { createMetadata } from "@/lib/metadata";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = createMetadata("Dashboard");

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>{children}</Suspense>
  );
}
