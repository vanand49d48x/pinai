import Link from "next/link";
import { Pin } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — pinai",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary">
            <Pin className="h-5 w-5" />
            pinai
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2, 2026</p>

        <div className="prose prose-neutral mt-8 max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold">Overview</h2>
            <p>
              pinai (&quot;we&quot;, &quot;our&quot;, &quot;the app&quot;) is a Pinterest pin scheduling
              tool. This policy describes what data we collect and how we use it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Information we collect</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Account information:</strong> email address when you sign in via magic link
                or Google OAuth (handled by Supabase Auth).
              </li>
              <li>
                <strong>Pin content:</strong> images you upload or link, titles, descriptions,
                keywords, and scheduling data you provide.
              </li>
              <li>
                <strong>Pinterest connection:</strong> OAuth access and refresh tokens, your
                Pinterest username, and synced board names. Tokens are encrypted at rest.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">How we use your data</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Authenticate you and provide access to the app.</li>
              <li>Store and display your pins and scheduling preferences.</li>
              <li>Generate SEO metadata for pins using Anthropic Claude (image URL, topic, and keywords are sent to Anthropic&apos;s API).</li>
              <li>Publish pins to Pinterest on your behalf at scheduled times.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Third-party services</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong>Supabase</strong> — authentication, database, and image storage.</li>
              <li><strong>Anthropic</strong> — AI metadata generation from pin images and text.</li>
              <li><strong>Pinterest</strong> — OAuth and pin publishing via the Pinterest API.</li>
              <li><strong>Vercel</strong> — application hosting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Data retention &amp; deletion</h2>
            <p>
              Your data is stored until you delete it or disconnect your account. You can delete
              individual pins in the dashboard. Disconnecting Pinterest removes stored OAuth tokens.
              Contact us to request full account deletion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Data sharing</h2>
            <p>
              We do not sell your personal data. Data is shared only with the third-party services
              listed above, solely to operate the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Contact</h2>
            <p>
              For privacy questions, contact the app operator through the GitHub repository at{" "}
              <a
                href="https://github.com/vanand49d48x/pinai"
                className="text-primary hover:underline"
              >
                github.com/vanand49d48x/pinai
              </a>
              .
            </p>
          </section>
        </div>

        <p className="mt-12">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
