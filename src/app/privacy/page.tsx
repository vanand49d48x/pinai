import Link from "next/link";
import { APP_NAME, COMPANY_NAME, SUPPORT_EMAIL } from "@/lib/brand";
import { SiteFooter } from "@/components/layout/site-footer";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata("Privacy");

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Link href="/" className="font-bold text-primary">{APP_NAME}</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>
            <p className="mt-2">
              {APP_NAME}, operated by {COMPANY_NAME}, is a Pinterest pin scheduling tool. This policy describes what
              data we collect and how we use it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Information we collect</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li><strong>Account information:</strong> email address when you sign in (via Supabase Auth).</li>
              <li><strong>Pin content:</strong> images, titles, descriptions, keywords, and scheduling data you provide.</li>
              <li><strong>Pinterest connection:</strong> OAuth tokens (encrypted), username, and synced board names.</li>
              <li><strong>Waitlist:</strong> email if you join our launch waitlist.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">How we use your data</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Authenticate you and provide the service.</li>
              <li>Generate metadata via Anthropic Claude (image URL, topic, keywords sent to Anthropic).</li>
              <li>Publish pins to Pinterest at scheduled times via the official API.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Third-party services</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li><strong>Supabase</strong> — auth, database, storage</li>
              <li><strong>Anthropic</strong> — AI metadata generation</li>
              <li><strong>Pinterest</strong> — OAuth and publishing</li>
              <li><strong>Vercel</strong> — hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Data retention &amp; deletion</h2>
            <p className="mt-2">
              Data is kept until you delete it or your account. Delete individual pins in the dashboard, disconnect
              Pinterest in Settings, or delete your entire account (which removes all associated data).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p className="mt-2">
              Privacy questions:{" "}
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
