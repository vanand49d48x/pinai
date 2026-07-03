import { AppNav } from "@/components/layout/app-nav";
import { SiteFooter } from "@/components/layout/site-footer";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
