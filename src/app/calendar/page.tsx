"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { WeekCalendar } from "@/components/calendar/week-calendar";
import { Skeleton } from "@/components/ui/skeleton";
import type { PinWithBoard } from "@/types/database";

export default function CalendarPage() {
  const [pins, setPins] = useState<PinWithBoard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPins() {
      const res = await fetch("/api/pins");
      if (res.ok) {
        const data = await res.json();
        setPins(data.pins);
      }
      setLoading(false);
    }
    fetchPins();
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">Weekly view of your scheduled pins</p>
      </div>

      {loading ? <Skeleton className="h-96" /> : <WeekCalendar pins={pins} />}
    </DashboardLayout>
  );
}
