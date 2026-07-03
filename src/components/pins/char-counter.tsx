"use client";

import { cn } from "@/lib/utils";

interface CharCounterProps {
  current: number;
  max: number;
  className?: string;
}

export function CharCounter({ current, max, className }: CharCounterProps) {
  const atLimit = current >= max;
  return (
    <span className={cn("text-xs", atLimit ? "font-medium text-destructive" : "text-muted-foreground", className)}>
      {current}/{max}
    </span>
  );
}

export function isOverLimit(value: string, max: number): boolean {
  return value.length > max;
}
