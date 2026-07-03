import Link from "next/link";
import { APP_NAME, COMPANY_NAME, SUPPORT_EMAIL } from "@/lib/brand";
import { SiteFooter } from "@/components/layout/site-footer";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata("Terms");

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Link href="/" className="font-bold text-primary">{APP_NAME}</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Agreement</h2>
            <p className="mt-2">
              By using {APP_NAME}, operated by {COMPANY_NAME} (&quot;we&quot;, &quot;us&quot;), you agree to these Terms.
              If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Service description</h2>
            <p className="mt-2">
              {APP_NAME} helps you create, schedule, and publish content to Pinterest using the official Pinterest API.
              AI-generated metadata is provided as suggestions — you are responsible for reviewing content before publishing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Account &amp; Pinterest connection</h2>
            <p className="mt-2">
              You must provide accurate account information. Connecting Pinterest grants us permission to publish on your
              behalf per the scopes you authorize. You may disconnect at any time in Settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Acceptable use</h2>
            <p className="mt-2">
              You may not use {APP_NAME} to publish spam, misleading content, or material that violates Pinterest&apos;s
              community guidelines or applicable law. We may suspend accounts that abuse the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Payment</h2>
            <p className="mt-2">
              Paid plans are launching soon. When billing goes live, pricing and refund terms will be updated here.
              Free-tier limits may change with notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Disclaimer</h2>
            <p className="mt-2">
              The service is provided &quot;as is&quot; without warranties. We are not liable for Pinterest API outages,
              account restrictions imposed by Pinterest, or losses from scheduled posts that fail to publish.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Contact</h2>
            <p className="mt-2">
              Questions? Email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </section>
        </div>

        <p className="mt-12">
          <Link href="/" className="text-sm text-primary hover:underline">← Back to home</Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
