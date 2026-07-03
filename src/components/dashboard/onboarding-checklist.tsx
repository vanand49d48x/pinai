"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingState {
  pinterestConnected: boolean;
  hasPin: boolean;
  hasScheduled: boolean;
}

const DISMISS_KEY = "pinai-onboarding-dismissed";

const steps = [
  {
    key: "pinterestConnected" as const,
    label: "Connect your Pinterest account",
    href: "/settings",
    cta: "Connect",
  },
  {
    key: "hasPin" as const,
    label: "Create your first pin",
    href: "/pins/new",
    cta: "New pin",
  },
  {
    key: "hasScheduled" as const,
    label: "Schedule it",
    href: "/calendar",
    cta: "Open calendar",
  },
];

export function OnboardingChecklist() {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then(setState)
      .catch(() => setState(null));
  }, []);

  useEffect(() => {
    if (!state) return;
    const allDone =
      state.pinterestConnected && state.hasPin && state.hasScheduled;
    if (allDone && !dismissed) {
      localStorage.setItem(DISMISS_KEY, "true");
      setDismissed(true);
    }
  }, [state, dismissed]);

  if (!state || dismissed) return null;

  const allDone = steps.every((s) => state[s.key]);
  if (allDone) return null;

  return (
    <Card className="mb-8 border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg">Get started with PinAI</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step) => {
          const done = state[step.key];
          return (
            <div
              key={step.key}
              className={cn(
                "flex items-center justify-between rounded-lg border bg-background p-3",
                done && "opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                {done ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={cn("text-sm", done && "line-through")}>{step.label}</span>
              </div>
              {!done && (
                <Button size="sm" variant="outline" asChild>
                  <Link href={step.href}>{step.cta}</Link>
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
