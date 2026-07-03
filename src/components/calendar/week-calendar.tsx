"use client";

import {
  addDays,
  format,
  startOfWeek,
  isSameDay,
  parseISO,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/pins/status-badge";
import type { PinWithBoard } from "@/types/database";

interface WeekCalendarProps {
  pins: PinWithBoard[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WeekCalendar({ pins }: WeekCalendarProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const scheduledPins = pins.filter(
    (p) => p.scheduled_at && ["scheduled", "publishing", "posted"].includes(p.status)
  );

  function getPinsForDayHour(day: Date, hour: number) {
    return scheduledPins.filter((pin) => {
      if (!pin.scheduled_at) return false;
      const date = parseISO(pin.scheduled_at);
      return isSameDay(date, day) && date.getHours() === hour;
    });
  }

  if (scheduledPins.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">No scheduled pins this week.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Week of {format(weekStart, "MMM d, yyyy")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 border-b">
              <div className="p-2 text-xs font-medium text-muted-foreground">Time</div>
              {days.map((day) => (
                <div key={day.toISOString()} className="border-l p-2 text-center">
                  <div className="text-xs font-medium">{format(day, "EEE")}</div>
                  <div className="text-lg font-bold">{format(day, "d")}</div>
                </div>
              ))}
            </div>
            {HOURS.filter((h) => h >= 6 && h <= 22).map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b last:border-0">
                <div className="p-2 text-xs text-muted-foreground">
                  {format(new Date().setHours(hour, 0), "h a")}
                </div>
                {days.map((day) => {
                  const dayPins = getPinsForDayHour(day, hour);
                  return (
                    <div key={day.toISOString()} className="min-h-[48px] border-l p-1">
                      {dayPins.map((pin) => (
                        <div
                          key={pin.id}
                          className="mb-1 rounded bg-primary/10 p-1 text-xs"
                          title={pin.title ?? pin.topic}
                        >
                          <p className="truncate font-medium">{pin.title ?? pin.topic}</p>
                          <StatusBadge status={pin.status} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
