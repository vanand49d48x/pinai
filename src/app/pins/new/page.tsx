import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NewPinForm } from "@/components/pins/new-pin-form";
import { BulkImport } from "@/components/pins/bulk-import";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createMetadata } from "@/lib/metadata";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = createMetadata("New Pin");

async function NewPinContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: boards }, { data: account }] = await Promise.all([
    supabase.from("boards").select("*").eq("user_id", user.id).order("name"),
    supabase.from("pinterest_accounts").select("id").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">New pin</h1>
        <p className="text-muted-foreground">Create a pin or bulk import from CSV</p>
      </div>
      <div className="space-y-8">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <NewPinForm
            boards={boards ?? []}
            userId={user.id}
            pinterestConnected={Boolean(account)}
          />
        </Suspense>
        <BulkImport />
      </div>
    </>
  );
}

export default function NewPinPage() {
  return (
    <DashboardLayout>
      <NewPinContent />
    </DashboardLayout>
  );
}
