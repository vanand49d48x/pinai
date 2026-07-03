"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PinTable } from "@/components/dashboard/pin-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Pin, PinWithBoard } from "@/types/database";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "generating", label: "Generating" },
  { value: "ready", label: "Ready" },
  { value: "scheduled", label: "Scheduled" },
  { value: "posted", label: "Posted" },
  { value: "failed", label: "Failed" },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [pins, setPins] = useState<PinWithBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchPins = useCallback(async () => {
    setLoading(true);
    const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
    const res = await fetch(`/api/pins${params}`);
    if (res.ok) {
      const data = await res.json();
      setPins(data.pins);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchPins();
  }, [fetchPins]);

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage and schedule your pins</p>
        </div>
        <Button asChild>
          <Link href="/pins/new">New pin</Link>
        </Button>
      </div>

      <OnboardingChecklist />

      {loading ? (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="mb-8">
          <StatsCards pins={pins as Pin[]} />
        </div>
      )}

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : (
        <PinTable initialPins={pins} onRefresh={fetchPins} highlightId={highlightId} />
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <DashboardContent />
      </Suspense>
    </DashboardLayout>
  );
}
