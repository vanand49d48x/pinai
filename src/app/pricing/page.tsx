"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { PLAN_LIMITS, PLAN_PRICES } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  { id: "free" as const, name: "Free", price: { month: 0, year: 0 } },
  { id: "starter" as const, name: "Starter", price: PLAN_PRICES.starter },
  { id: "pro" as const, name: "Pro", price: PLAN_PRICES.pro },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-bold text-primary">
            {APP_NAME}
          </Link>
          <Button asChild>
            <Link href="/login">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Pricing</h1>
          <p className="mt-2 text-muted-foreground">{APP_TAGLINE}</p>
          <div className="mt-6 inline-flex rounded-lg border p-1">
            <button
              type="button"
              className={`rounded-md px-4 py-2 text-sm ${!yearly ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setYearly(false)}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`rounded-md px-4 py-2 text-sm ${yearly ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setYearly(true)}
            >
              Yearly (2 months free)
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const limits = PLAN_LIMITS[plan.id];
            const price = yearly ? plan.price.year : plan.price.month;
            return (
              <Card key={plan.id} className={plan.id === "starter" ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    ${price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{yearly ? "yr" : "mo"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-primary" /> {limits.maxAccounts} Pinterest account(s)
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-primary" /> {limits.maxPinsPerMonth} pins/month
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-primary" /> {limits.maxAiPerMonth} AI generations/month
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-primary" /> Bulk CSV: {limits.bulkCsv ? "Yes" : "No"}
                    </li>
                  </ul>
                  {plan.id !== "free" && (
                    <Button className="mt-4 w-full" asChild>
                      <Link href="/login">Start {plan.name}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <section className="mx-auto mt-20 max-w-2xl">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <div className="mt-6 space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Can I cancel anytime?</p>
              <p>Yes — use the billing portal to cancel. You keep access until the period ends.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">What happens when I downgrade?</p>
              <p>Existing pins stay. New creations are limited to your new plan&apos;s quotas.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Do scheduled pins count at publish time?</p>
              <p>Limits apply when creating pins and generating AI copy, not when the cron publishes.</p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
