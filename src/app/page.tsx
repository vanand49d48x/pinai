import Link from "next/link";
import { Pin, Sparkles, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-primary">
            <Pin className="h-5 w-5" />
            pinai
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Schedule Pinterest pins with{" "}
            <span className="text-primary">AI-powered SEO</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Upload or link pin images, let AI generate keyword-rich titles and descriptions,
            and auto-publish to Pinterest at the perfect time.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/login">Start Scheduling Free</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <Sparkles className="mb-4 h-10 w-10 text-primary" />
                <h3 className="text-lg font-semibold">AI Metadata</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Claude generates SEO-optimized titles, descriptions, and hashtags tailored to your topic and keywords.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Calendar className="mb-4 h-10 w-10 text-primary" />
                <h3 className="text-lg font-semibold">Smart Scheduling</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Plan your content calendar with a visual week view and automatic publishing on schedule.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <BarChart3 className="mb-4 h-10 w-10 text-primary" />
                <h3 className="text-lg font-semibold">Bulk Import</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Import dozens of pins at once via CSV, generate metadata in batch, and schedule them all.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        pinai — Built with Next.js, Supabase, and Anthropic
      </footer>
    </div>
  );
}
