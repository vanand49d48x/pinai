"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import type { Pin } from "@/types/database";
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

interface StatsCardsProps {
  pins: Pin[];
}

export function StatsCards({ pins }: StatsCardsProps) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

  const scheduledThisWeek = pins.filter(
    (p) =>
      p.status === "scheduled" &&
      p.scheduled_at &&
      isWithinInterval(new Date(p.scheduled_at), { start: weekStart, end: weekEnd })
  ).length;

  const postedTotal = pins.filter((p) => p.status === "posted").length;
  const failedTotal = pins.filter((p) => p.status === "failed").length;

  const stats = [
    {
      title: "Scheduled this week",
      value: scheduledThisWeek,
      hint: "Pins you schedule will show up here",
      icon: Calendar,
      color: "text-purple-600",
    },
    {
      title: "Posted total",
      value: postedTotal,
      hint: "Successfully published pins appear here",
      icon: CheckCircle,
      color: "text-emerald-600",
    },
    {
      title: "Failed",
      value: failedTotal,
      hint: "Publishing errors will be listed here",
      icon: XCircle,
      color: "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map(({ title, value, hint, icon: Icon, color }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {value === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
