"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Unlink } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Board, PinterestAccount } from "@/types/database";

export default function SettingsContent() {
  const searchParams = useSearchParams();
  const [account, setAccount] = useState<Partial<PinterestAccount> | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectingSandbox, setConnectingSandbox] = useState(false);
  const [sandboxAvailable, setSandboxAvailable] = useState(false);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) toast.success("Pinterest connected successfully");
    if (error) toast.error(decodeURIComponent(error));
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/pinterest/status");
      if (res.ok) {
        const data = await res.json();
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
      toast.error(data.error ?? "Sandbox connect failed");
      return;
    }

    const data = await res.json();
    toast.success(`Connected sandbox (@${data.username}, ${data.boardCount} boards)`);

    const statusRes = await fetch("/api/pinterest/status");
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      setAccount(statusData.account);
      setBoards(statusData.boards ?? []);
    }
  }

  async function handleDisconnect() {
    const res = await fetch("/api/pinterest/disconnect", { method: "POST" });
    if (!res.ok) {
      toast.error("Failed to disconnect");
      return;
    }
    setAccount(null);
    setBoards([]);
    toast.success("Pinterest disconnected");
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your Pinterest connection</p>
      </div>

      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pinterest Connection</CardTitle>
              <CardDescription>
                Connect your Pinterest account to publish pins automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {account ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="ready">Connected</Badge>
                    {account.pinterest_username && (
                      <span className="text-sm">@{account.pinterest_username}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSync} disabled={syncing}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                      Resync Boards
                    </Button>
                    <Button variant="destructive" onClick={handleDisconnect}>
                      <Unlink className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {sandboxAvailable && (
                    <Button
                      onClick={handleConnectSandbox}
                      disabled={connectingSandbox}
                    >
                      {connectingSandbox ? "Connecting..." : "Connect Sandbox Token"}
                    </Button>
                  )}
                  <Button variant={sandboxAvailable ? "outline" : "default"} asChild>
                    <a href="/api/pinterest/authorize">Connect via OAuth</a>
                  </Button>
                  {sandboxAvailable && (
                    <p className="text-xs text-muted-foreground">
                      Sandbox token is configured server-side. Use this for testing without OAuth.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {boards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Synced Boards ({boards.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {boards.map((board) => (
                    <li key={board.id} className="py-2 text-sm">
                      {board.name}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
