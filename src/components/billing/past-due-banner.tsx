"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export function PastDueBanner() {
  const [pastDue, setPastDue] = useState(false);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((data) => setPastDue(data.status === "past_due"))
      .catch(() => {});

    function onLimit(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.code === "PAST_DUE") setPastDue(true);
    }
    window.addEventListener("pinai-billing-limit", onLimit);
    return () => window.removeEventListener("pinai-billing-limit", onLimit);
  }, []);

  if (!pastDue) return null;

  return (
    <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm">
      <AlertCircle className="mr-2 inline h-4 w-4 text-destructive" />
      Payment failed — update your card to create pins and generate AI copy.{" "}
      <Link href="/settings/billing" className="font-medium underline">
        Manage billing
      </Link>
    </div>
  );
}
