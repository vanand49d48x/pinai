"use client";

import { Toaster } from "sonner";
import { BillingProvider } from "@/components/billing/billing-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BillingProvider>
      {children}
      <Toaster richColors position="top-right" />
    </BillingProvider>
  );
}
