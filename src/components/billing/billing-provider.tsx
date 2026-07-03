"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { LimitCode } from "@/lib/plans";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { PastDueBanner } from "@/components/billing/past-due-banner";

interface BillingContextValue {
  showUpgrade: (code: LimitCode, message: string) => void;
}

const BillingContext = createContext<BillingContextValue | null>(null);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<{ code: LimitCode; message: string } | null>(null);

  const showUpgrade = useCallback((code: LimitCode, message: string) => {
    setModal({ code, message });
  }, []);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ code: LimitCode; error: string }>).detail;
      if (detail?.code) {
        setModal({ code: detail.code, message: detail.error ?? "Plan limit reached" });
      }
    }
    window.addEventListener("pinai-billing-limit", handler);
    return () => window.removeEventListener("pinai-billing-limit", handler);
  }, []);

  return (
    <BillingContext.Provider value={{ showUpgrade }}>
      <PastDueBanner />
      {children}
      {modal && (
        <UpgradeModal
          code={modal.code}
          message={modal.message}
          onClose={() => setModal(null)}
        />
      )}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling must be used within BillingProvider");
  return ctx;
}

export async function billingFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status === 402 && typeof window !== "undefined") {
    try {
      const data = await response.clone().json();
      window.dispatchEvent(
        new CustomEvent("pinai-billing-limit", { detail: data })
      );
    } catch {
      // ignore
    }
  }
  return response;
}
