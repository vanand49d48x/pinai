"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { LimitCode } from "@/lib/plans";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  code: LimitCode;
  message: string;
  onClose: () => void;
}

export function UpgradeModal({ code, message, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState<"starter" | "pro" | null>(null);

  async function checkout(plan: "starter" | "pro") {
    setLoading(plan);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval: "month" }),
    });
    setLoading(null);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Checkout failed");
      return;
    }
    window.location.href = data.url;
  }

  const title =
    code === "PAST_DUE"
      ? "Payment failed"
      : code === "LIMIT_BULK"
        ? "Upgrade for bulk import"
        : "Upgrade your plan";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        {code === "PAST_DUE" ? (
          <DialogFooter>
            <Button asChild>
              <Link href="/settings/billing">Update payment method</Link>
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => checkout("starter")}
              disabled={loading !== null}
            >
              {loading === "starter" ? "Loading..." : "Starter — $12/mo"}
            </Button>
            <Button onClick={() => checkout("pro")} disabled={loading !== null}>
              {loading === "pro" ? "Loading..." : "Pro — $29/mo"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
