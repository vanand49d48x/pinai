"use client";

import { useState } from "react";
import Link from "next/link";
import {
  addDays,
  addWeeks,
  format,
  startOfWeek,
  isSameDay,
  parseISO,
  setHours,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusBadge } from "@/components/pins/status-badge";
import type { PinWithBoard } from "@/types/database";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

interface WeekCalendarProps {
  pins: PinWithBoard[];
  onRefresh: () => void;
}

export function WeekCalendar({ pins, onRefresh }: WeekCalendarProps) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const scheduledPins = pins.filter(
    (p) => p.scheduled_at && ["scheduled", "publishing", "posted", "ready"].includes(p.status)
  );

  function getPinsForDayHour(day: Date, hour: number) {
    return scheduledPins.filter((pin) => {
      if (!pin.scheduled_at) return false;
      const date = parseISO(pin.scheduled_at);
      return isSameDay(date, day) && date.getHours() === hour;
    });
  }

  async function unschedule(id: string) {
    const res = await fetch(`/api/pins/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduled_at: null, status: "ready" }),
    });
    if (!res.ok) {
      toast.error("Failed to unschedule");
      return;
    }
    toast.success("Pin unscheduled");
    onRefresh();
  }

  function slotLink(day: Date, hour: number) {
    const dt = setHours(day, hour);
    return `/pins/new?scheduled_at=${encodeURIComponent(dt.toISOString())}`;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Week of {format(weekStart, "MMM d, yyyy")}</CardTitle>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => addWeeks(w, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => addWeeks(w, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 border-b">
              <div className="p-2 text-xs text-muted-foreground" />
              {days.map((day) => (
                <div key={day.toISOString()} className="border-l p-2 text-center">
                  <div className="text-xs font-medium">{format(day, "EEE")}</div>
                  <div className={isSameDay(day, new Date()) ? "text-lg font-bold text-primary" : "text-lg font-bold"}>
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b last:border-0">
                <div className="p-2 text-xs text-muted-foreground">
                  {format(setHours(new Date(), hour), "h a")}
                </div>
                {days.map((day) => {
                  const dayPins = getPinsForDayHour(day, hour);
                  return (
                    <div key={day.toISOString()} className="min-h-[52px] border-l p-0.5">
                      {dayPins.length === 0 ? (
                        <Link
                          href={slotLink(day, hour)}
                          className="flex h-full min-h-[48px] items-center justify-center rounded text-[10px] text-muted-foreground/50 hover:bg-muted/50 hover:text-muted-foreground"
                        >
                          +
                        </Link>
                      ) : (
                        dayPins.map((pin) => (
                          <Popover key={pin.id}>
                            <PopoverTrigger asChild>
                              <button className="mb-0.5 flex w-full items-center gap-1 rounded bg-primary/10 p-1 text-left text-[10px] hover:bg-primary/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={pin.image_url} alt="" className="h-6 w-4 rounded object-cover" />
                                <span className="truncate">{pin.title ?? pin.topic}</span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                              <p className="font-medium">{pin.title ?? pin.topic}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{pin.description}</p>
                              <div className="mt-2">
                                <StatusBadge status={pin.status} />
                              </div>
                              <div className="mt-3 flex gap-2">
                                <Button size="sm" variant="outline" asChild>
                                  <Link href="/dashboard">Edit</Link>
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => unschedule(pin.id)}>
                                  Unschedule
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            {scheduledPins.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No pins scheduled this week — click a slot to create one
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
