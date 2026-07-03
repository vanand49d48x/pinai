import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NewPinForm } from "@/components/pins/new-pin-form";
import { BulkImport } from "@/components/pins/bulk-import";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewPinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: boards } = await supabase
    .from("boards")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">New Pin</h1>
        <p className="text-muted-foreground">Create a single pin or bulk import from CSV</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <NewPinForm boards={boards ?? []} userId={user.id} />
        <BulkImport />
      </div>
    </DashboardLayout>
  );
}
