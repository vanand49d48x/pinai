"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/pins/status-badge";
import type { PinWithBoard } from "@/types/database";

interface PinTableProps {
  initialPins: PinWithBoard[];
  onRefresh: () => void;
}

export function PinTable({ initialPins, onRefresh }: PinTableProps) {
  const [pins, setPins] = useState(initialPins);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  async function updatePin(id: string, updates: Record<string, unknown>) {
    const res = await fetch(`/api/pins/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Update failed");
      return;
    }

    const { pin } = await res.json();
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, ...pin } : p)));
    toast.success("Pin updated");
  }

  async function generatePin(id: string) {
    setPins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "generating" as const } : p))
    );

    const res = await fetch(`/api/pins/${id}/generate`, { method: "POST" });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Generation failed");
      onRefresh();
      return;
    }

    const { pin } = await res.json();
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, ...pin } : p)));
    toast.success("Metadata generated");
  }

  async function deletePin(id: string) {
    const res = await fetch(`/api/pins/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    setPins((prev) => prev.filter((p) => p.id !== id));
    toast.success("Pin deleted");
  }

  async function generateAll() {
    const drafts = pins.filter((p) => p.status === "draft");
    if (drafts.length === 0) {
      toast.info("No draft pins to generate");
      return;
    }

    setGeneratingAll(true);
    setProgress({ current: 0, total: drafts.length });

    for (let i = 0; i < drafts.length; i++) {
      setProgress({ current: i + 1, total: drafts.length });
      await generatePin(drafts[i].id);
      if (i < drafts.length - 1) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    setGeneratingAll(false);
    setProgress(null);
    toast.success(`Generated metadata for ${drafts.length} pins`);
  }

  const draftCount = pins.filter((p) => p.status === "draft").length;

  if (pins.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">No pins yet. Create your first pin to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {draftCount > 0 && (
        <div className="flex items-center gap-4">
          <Button onClick={generateAll} disabled={generatingAll}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate All ({draftCount})
          </Button>
          {progress && (
            <span className="text-sm text-muted-foreground">
              Generating {progress.current} of {progress.total}...
            </span>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Image</th>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-left font-medium">Board</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Scheduled</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pins.map((pin) => (
              <tr key={pin.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded">
                    <Image
                      src={pin.image_url}
                      alt={pin.alt_text ?? pin.topic}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </td>
                <td className="max-w-[180px] px-4 py-3">
                  {["ready", "scheduled", "draft", "failed"].includes(pin.status) ? (
                    <Input
                      defaultValue={pin.title ?? ""}
                      maxLength={100}
                      className="h-8 text-xs"
                      onBlur={(e) => {
                        if (e.target.value !== (pin.title ?? "")) {
                          updatePin(pin.id, { title: e.target.value });
                        }
                      }}
                    />
                  ) : (
                    <span className="line-clamp-2">{pin.title ?? "—"}</span>
                  )}
                </td>
                <td className="max-w-[220px] px-4 py-3">
                  {["ready", "scheduled", "draft", "failed"].includes(pin.status) ? (
                    <Textarea
                      defaultValue={pin.description ?? ""}
                      maxLength={500}
                      className="min-h-[60px] text-xs"
                      onBlur={(e) => {
                        if (e.target.value !== (pin.description ?? "")) {
                          updatePin(pin.id, { description: e.target.value });
                        }
                      }}
                    />
                  ) : (
                    <span className="line-clamp-3">{pin.description ?? "—"}</span>
                  )}
                </td>
                <td className="px-4 py-3">{pin.boards?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={pin.status} />
                  {pin.error_message && (
                    <p className="mt-1 text-xs text-red-600">{pin.error_message}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {["ready", "scheduled"].includes(pin.status) ? (
                    <Input
                      type="datetime-local"
                      defaultValue={
                        pin.scheduled_at
                          ? new Date(pin.scheduled_at).toISOString().slice(0, 16)
                          : ""
                      }
                      className="h-8 w-44 text-xs"
                      onBlur={(e) => {
                        if (e.target.value) {
                          updatePin(pin.id, {
                            scheduled_at: new Date(e.target.value).toISOString(),
                          });
                        }
                      }}
                    />
                  ) : pin.scheduled_at ? (
                    new Date(pin.scheduled_at).toLocaleString()
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {(pin.status === "draft" ||
                      pin.status === "failed" ||
                      pin.status === "generating") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generatePin(pin.id)}
                        disabled={pin.status === "generating"}
                      >
                        <Sparkles className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePin(pin.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
