"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Unlink, User } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { Board, PinterestAccount } from "@/types/database";

export default function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [account, setAccount] = useState<Partial<PinterestAccount> | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectingSandbox, setConnectingSandbox] = useState(false);
  const [sandboxAvailable, setSandboxAvailable] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) toast.success("Pinterest connected");
    if (error) toast.error(decodeURIComponent(error));
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: userData }, statusRes] = await Promise.all([
        supabase.auth.getUser(),
        fetch("/api/pinterest/status"),
      ]);
      setEmail(userData.user?.email ?? null);
      if (statusRes.ok) {
        const data = await statusRes.json();
        setAccount(data.account);
        setBoards(data.boards ?? []);
        setSandboxAvailable(Boolean(data.sandboxConnectAvailable));
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSync() {
    setSyncing(true);
    const res = await fetch("/api/pinterest/sync-boards", { method: "POST" });
    setSyncing(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Sync failed");
      return;
    }
    const data = await res.json();
    toast.success(`Synced ${data.synced} boards`);
    const statusRes = await fetch("/api/pinterest/status");
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      setBoards(statusData.boards ?? []);
    }
  }

  async function handleConnectSandbox() {
    setConnectingSandbox(true);
    const res = await fetch("/api/pinterest/connect-sandbox", { method: "POST" });
    setConnectingSandbox(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Connection failed");
      return;
    }
    const data = await res.json();
    toast.success(`Connected (@${data.username}, ${data.boardCount} boards)`);
    const statusRes = await fetch("/api/pinterest/status");
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      setAccount(statusData.account);
      setBoards(statusData.boards ?? []);
    }
  }

  async function handleDisconnect() {
    const res = await fetch("/api/pinterest/disconnect", { method: "POST" });
    setDisconnectOpen(false);
    if (!res.ok) {
      toast.error("Failed to disconnect");
      return;
    }
    setAccount(null);
    setBoards([]);
    toast.success("Pinterest disconnected");
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    setDeleting(false);
    setDeleteOpen(false);
    if (!res.ok) {
      toast.error("Failed to delete account");
      return;
    }
    toast.success("Account deleted");
    router.push("/");
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and Pinterest connection</p>
      </div>

      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pinterest</CardTitle>
              <CardDescription>Connect to publish pins automatically</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {account ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {(account.pinterest_username ?? "P")[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="ready">Connected</Badge>
                        {account.pinterest_username && (
                          <span className="text-sm">@{account.pinterest_username}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{boards.length} boards synced</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={handleSync} disabled={syncing}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                      Resync boards
                    </Button>
                    <Button variant="destructive" onClick={() => setDisconnectOpen(true)}>
                      <Unlink className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <Button asChild>
                    <a href="/api/pinterest/authorize">Connect Pinterest</a>
                  </Button>
                  {sandboxAvailable && (
                    <Button variant="outline" onClick={handleConnectSandbox} disabled={connectingSandbox}>
                      {connectingSandbox ? "Connecting..." : "Connect test token"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {boards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Synced boards</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {boards.map((b) => (
                    <li key={b.id} className="py-2">{b.name}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Signed in as <strong>{email ?? "—"}</strong>
              </p>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                Delete account
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Pinterest?</DialogTitle>
            <DialogDescription>
              This removes stored tokens. Scheduled pins won&apos;t publish until you reconnect.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your pins, boards, and Pinterest connection. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
