import Link from "next/link";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/brand";

export function SiteFooter({ className = "" }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className={`border-t bg-background py-10 ${className}`}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
        <p>© {year} {APP_NAME}. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-foreground">
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
