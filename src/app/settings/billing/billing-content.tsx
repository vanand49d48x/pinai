"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PLAN_PRICES } from "@/lib/plans";

interface BillingStatus {
  plan: "free" | "starter" | "pro";
  status: string;
  currentPeriodEnd: string | null;
  usage: {
    pinsCreated: number;
    aiGenerations: number;
    maxPins: number;
    maxAi: number;
    maxAccounts: number;
    bulkCsv: boolean;
  };
}

export default function BillingSettingsContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("upgraded")) toast.success("Welcome to your new plan!");
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  async function checkout(plan: "starter" | "pro", interval: "month" | "year") {
    setCheckoutLoading(true);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval }),
    });
    setCheckoutLoading(false);
    const result = await res.json();
    if (!res.ok) {
      toast.error(result.error ?? "Checkout failed");
      return;
    }
    window.location.href = result.url;
  }

  async function openPortal() {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const result = await res.json();
    if (!res.ok) {
      toast.error(result.error ?? "Could not open billing portal");
      return;
    }
    window.location.href = result.url;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-64" />
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const pinsPct = (data.usage.pinsCreated / data.usage.maxPins) * 100;
  const aiPct = (data.usage.aiGenerations / data.usage.maxAi) * 100;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your plan and usage</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Current plan
              <Badge variant={data.status === "active" ? "ready" : "failed"}>
                {data.plan}
              </Badge>
            </CardTitle>
            <CardDescription>
              Status: {data.status.replace("_", " ")}
              {data.currentPeriodEnd && (
                <> · Renews {new Date(data.currentPeriodEnd).toLocaleDateString()}</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.plan !== "free" ? (
              <Button variant="outline" onClick={openPortal}>
                Manage subscription
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => checkout("starter", "month")}
                  disabled={checkoutLoading}
                >
                  Starter — ${PLAN_PRICES.starter.month}/mo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => checkout("pro", "month")}
                  disabled={checkoutLoading}
                >
                  Pro — ${PLAN_PRICES.pro.month}/mo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage this month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Pins created</span>
                <span>
                  {data.usage.pinsCreated} / {data.usage.maxPins}
                </span>
              </div>
              <Progress value={Math.min(pinsPct, 100)} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>AI generations</span>
                <span>
                  {data.usage.aiGenerations} / {data.usage.maxAi}
                </span>
              </div>
              <Progress value={Math.min(aiPct, 100)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Pinterest accounts: up to {data.usage.maxAccounts} · Bulk CSV:{" "}
              {data.usage.bulkCsv ? "included" : "Pro only"}
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/pricing" className="text-primary hover:underline">
          Compare all plans
        </Link>
      </p>
    </DashboardLayout>
  );
}
