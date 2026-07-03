import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Calendar, Sparkles, Upload, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteFooter } from "@/components/layout/site-footer";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { PinHeroPreview } from "@/components/marketing/pin-hero-preview";

const faqs = [
  {
    q: "Is this against Pinterest's rules?",
    a: "No. PinAI uses Pinterest's official API v5 with OAuth. Your account stays in your control — we never scrape or automate outside their approved methods.",
  },
  {
    q: "How does AI metadata work?",
    a: "Upload a pin image plus topic and keywords. Claude analyzes the image and generates an SEO-optimized title, description, and alt text you can edit before publishing.",
  },
  {
    q: "Can I bulk import pins?",
    a: "Yes. Upload a CSV with image URLs, topics, boards, and schedule times. Generate AI copy for all drafts in one click.",
  },
  {
    q: "Do I need a Pinterest business account?",
    a: "You need a Pinterest account and a developer app approved for API access. Business accounts work best for API publishing.",
  },
  {
    q: "When will paid plans launch?",
    a: "Billing is coming soon. Join the waitlist to get early access and launch pricing.",
  },
];

const plans = [
  { name: "Free", price: "$0", features: ["10 pins/month", "AI metadata", "Basic scheduling"] },
  { name: "Starter", price: "$12", features: ["100 pins/month", "Bulk CSV import", "Calendar view"], soon: true },
  { name: "Pro", price: "$29", features: ["Unlimited pins", "Priority publishing", "Analytics (soon)"], soon: true },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">P</span>
            {APP_NAME}
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {APP_TAGLINE}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Generate titles, descriptions, and alt text from your pin image — then auto-publish to Pinterest on your schedule.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/login">
                  Start free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-10">
              <p className="mb-3 text-sm font-medium">Get launch updates</p>
              <WaitlistForm />
            </div>
          </div>
          <PinHeroPreview />
        </section>

        {/* How it works */}
        <section className="border-y bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold">How it works</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                { step: "1", title: "Upload your pin", desc: "Add an image URL or upload directly. Set topic and keywords.", icon: Upload },
                { step: "2", title: "AI writes the copy", desc: "One click generates SEO title, description, and alt text.", icon: Sparkles },
                { step: "3", title: "Schedule & publish", desc: "Pick a time on your calendar. PinAI publishes via the official API.", icon: Calendar },
              ].map(({ step, title, desc, icon: Icon }) => (
                <div key={step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-semibold text-primary">Step {step}</div>
                  <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold">Everything you need to scale Pinterest</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "AI copywriting", desc: "Keyword-rich titles and descriptions from your image + topic." },
                { title: "Scheduling calendar", desc: "Visual week view of every pin going out." },
                { title: "Bulk CSV import", desc: "Import dozens of pins and generate copy in batch." },
                { title: "Analytics", desc: "Performance insights — coming soon.", soon: true },
              ].map((f) => (
                <Card key={f.title}>
                  <CardHeader>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                    {f.soon && (
                      <span className="mt-2 inline-block text-xs font-medium text-primary">Coming soon</span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-y bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold">Simple pricing</h2>
            <p className="mt-2 text-center text-muted-foreground">Start free. Upgrade when you&apos;re ready.</p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.name} className={plan.name === "Starter" ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      {plan.price}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </div>
                    {"soon" in plan && plan.soon && (
                      <span className="text-xs font-medium text-primary">Launching soon</span>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" /> {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-center text-3xl font-bold">FAQ</h2>
            <div className="mt-12 space-y-6">
              {faqs.map(({ q, a }) => (
                <div key={q}>
                  <h3 className="font-semibold">{q}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-primary py-16 text-primary-foreground">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-3xl font-bold">Ready to automate your Pinterest?</h2>
            <p className="mt-4 opacity-90">Join creators using {APP_NAME} to publish smarter.</p>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link href="/login">Get started free</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
