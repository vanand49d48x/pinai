"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { addDays, format, nextSaturday, setHours, setMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PinPreview } from "@/components/pins/pin-preview";
import { CharCounter, isOverLimit } from "@/components/pins/char-counter";
import { billingFetch } from "@/components/billing/billing-provider";
import { createClient } from "@/lib/supabase/client";
import type { Board } from "@/types/database";

interface NewPinFormProps {
  boards: Board[];
  userId: string;
  pinterestConnected: boolean;
}

function toDatetimeLocal(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function tomorrow9am(): Date {
  return setMinutes(setHours(addDays(new Date(), 1), 9), 0);
}

function thisWeekend9am(): Date {
  const sat = nextSaturday(new Date());
  return setMinutes(setHours(sat, 9), 0);
}

export function NewPinForm({ boards, userId, pinterestConnected }: NewPinFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const initialSchedule = searchParams.get("scheduled_at")
    ? searchParams.get("scheduled_at")!.slice(0, 16)
    : toDatetimeLocal(tomorrow9am());

  const [pinId, setPinId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageSource, setImageSource] = useState<"upload" | "url">("upload");

  const [form, setForm] = useState({
    image_url: "",
    topic: "",
    keywords: "",
    destination_link: "",
    title: "",
    description: "",
    alt_text: "",
    board_id: "",
    scheduled_at: initialSchedule,
  });

  const canGenerate = form.image_url.trim() && form.topic.trim();

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.image_url.trim()) next.image_url = "Image is required";
    if (!form.topic.trim()) next.topic = "Topic is required";
    if (isOverLimit(form.title, 100)) next.title = "Title must be 100 characters or less";
    if (isOverLimit(form.description, 500)) next.description = "Description must be 500 characters or less";
    if (isOverLimit(form.alt_text, 500)) next.alt_text = "Alt text must be 500 characters or less";
    if (form.destination_link) {
      try {
        new URL(form.destination_link);
      } catch {
        next.destination_link = "Enter a valid URL";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("pin-images").upload(path, file);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("pin-images").getPublicUrl(path);
    setForm((p) => ({ ...p, image_url: data.publicUrl }));
    toast.success("Image uploaded");
  }

  async function ensureDraftPin(): Promise<string> {
    if (pinId) return pinId;

    const res = await billingFetch("/api/pins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: form.image_url,
        topic: form.topic,
        keywords: form.keywords,
        destination_link: form.destination_link || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to create pin");
    }

    const { pin } = await res.json();
    setPinId(pin.id);
    return pin.id as string;
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    if (!validate()) return;

    setGenerating(true);
    try {
      const id = await ensureDraftPin();
      const res = await billingFetch(`/api/pins/${id}/generate`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Generation failed");
      }
      const { pin } = await res.json();
      setForm((p) => ({
        ...p,
        title: pin.title ?? "",
        description: pin.description ?? "",
        alt_text: pin.alt_text ?? "",
      }));
      setGenerated(true);
      toast.success("AI copy generated — review and edit below");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (isOverLimit(form.title, 100) || isOverLimit(form.description, 500) || isOverLimit(form.alt_text, 500)) {
      toast.error("Fix character limits before submitting");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title || null,
        description: form.description || null,
        alt_text: form.alt_text || null,
        board_id: form.board_id || null,
        destination_link: form.destination_link || null,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        status: form.scheduled_at ? "scheduled" : "ready",
      };

      let id = pinId;
      if (id) {
        const res = await billingFetch(`/api/pins/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to save pin");
        }
      } else {
        const res = await billingFetch("/api/pins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: form.image_url,
            topic: form.topic,
            keywords: form.keywords,
            ...payload,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to create pin");
        }
        const { pin } = await res.json();
        id = pin.id;
      }

      toast.success(form.scheduled_at ? "Pin scheduled!" : "Pin saved!");
      router.push(`/dashboard?highlight=${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const scheduleChips = useMemo(
    () => [
      { label: "Tomorrow 9am", value: toDatetimeLocal(tomorrow9am()) },
      { label: "This weekend", value: toDatetimeLocal(thisWeekend9am()) },
    ],
    []
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Create pin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant={imageSource === "upload" ? "default" : "outline"} size="sm" onClick={() => setImageSource("upload")}>
                Upload
              </Button>
              <Button type="button" variant={imageSource === "url" ? "default" : "outline"} size="sm" onClick={() => setImageSource("url")}>
                URL
              </Button>
            </div>

            {imageSource === "upload" ? (
              <div>
                <Label htmlFor="file">Image</Label>
                <Input id="file" type="file" accept="image/*" onChange={handleFileUpload} disabled={loading} />
                {errors.image_url && <p className="mt-1 text-xs text-destructive">{errors.image_url}</p>}
              </div>
            ) : (
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                />
                {errors.image_url && <p className="mt-1 text-xs text-destructive">{errors.image_url}</p>}
              </div>
            )}

            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                required
                value={form.topic}
                onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
              />
              {errors.topic && <p className="mt-1 text-xs text-destructive">{errors.topic}</p>}
            </div>

            <div>
              <Label htmlFor="keywords">Keywords</Label>
              <Textarea
                id="keywords"
                value={form.keywords}
                onChange={(e) => setForm((p) => ({ ...p, keywords: e.target.value }))}
              />
            </div>

            {canGenerate && (
              <Button type="button" onClick={handleGenerate} disabled={generating} className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                {generating ? "Generating..." : "Generate title & description"}
              </Button>
            )}

            {(generated || form.title) && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title">Title</Label>
                    <CharCounter current={form.title.length} max={100} />
                  </div>
                  <Input
                    id="title"
                    value={form.title}
                    maxLength={100}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Description</Label>
                    <CharCounter current={form.description.length} max={500} />
                  </div>
                  <Textarea
                    id="description"
                    value={form.description}
                    maxLength={500}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="alt_text">Alt text</Label>
                    <CharCounter current={form.alt_text.length} max={500} />
                  </div>
                  <Input
                    id="alt_text"
                    value={form.alt_text}
                    maxLength={500}
                    onChange={(e) => setForm((p) => ({ ...p, alt_text: e.target.value }))}
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
                  Regenerate
                </Button>
              </>
            )}

            <div>
              <Label htmlFor="destination_link">Destination link</Label>
              <Input
                id="destination_link"
                type="url"
                value={form.destination_link}
                onChange={(e) => setForm((p) => ({ ...p, destination_link: e.target.value }))}
              />
              {errors.destination_link && (
                <p className="mt-1 text-xs text-destructive">{errors.destination_link}</p>
              )}
            </div>

            <div>
              <Label>Board</Label>
              <Select
                value={form.board_id}
                onValueChange={(v) => setForm((p) => ({ ...p, board_id: v }))}
                disabled={!pinterestConnected}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a board" />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!pinterestConnected && (
                <p className="mt-1 text-xs text-muted-foreground">
                  <Link href="/settings" className="text-primary hover:underline">
                    Connect Pinterest
                  </Link>{" "}
                  to choose a board
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="scheduled_at">Schedule</Label>
              <div className="mb-2 flex flex-wrap gap-2">
                {scheduleChips.map((chip) => (
                  <Button
                    key={chip.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm((p) => ({ ...p, scheduled_at: chip.value }))}
                  >
                    {chip.label}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("scheduled_at")?.focus()}
                >
                  Custom
                </Button>
              </div>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))}
              />
            </div>

            <Button type="submit" disabled={loading || isOverLimit(form.title, 100) || isOverLimit(form.description, 500)} className="w-full">
              {loading ? "Saving..." : form.scheduled_at ? "Schedule pin" : "Save pin"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <PinPreview
        imageUrl={form.image_url}
        title={form.title}
        description={form.description}
        destinationLink={form.destination_link}
        generating={generating}
      />
    </div>
  );
}
