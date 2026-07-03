import { Suspense } from "react";
import { createMetadata } from "@/lib/metadata";
import { Skeleton } from "@/components/ui/skeleton";
import BillingSettingsContent from "./billing-content";

export const metadata = createMetadata("Billing");

export default function BillingSettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-64 max-w-7xl" />}>
      <BillingSettingsContent />
    </Suspense>
  );
}
