"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { createClient } from "@/lib/supabase/client";
import type { Board } from "@/types/database";

interface NewPinFormProps {
  boards: Board[];
  userId: string;
}

export function NewPinForm({ boards, userId }: NewPinFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [imageSource, setImageSource] = useState<"upload" | "url">("upload");
  const [form, setForm] = useState({
    image_url: "",
    topic: "",
    keywords: "",
    destination_link: "",
    board_id: "",
    scheduled_at: "",
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("pin-images").upload(path, file);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const { data } = supabase.storage.from("pin-images").getPublicUrl(path);
    setForm((prev) => ({ ...prev, image_url: data.publicUrl }));
    setLoading(false);
    toast.success("Image uploaded");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.image_url) {
      toast.error("Please provide an image");
      return;
    }

    setLoading(true);

    const payload = {
      image_url: form.image_url,
      topic: form.topic,
      keywords: form.keywords,
      destination_link: form.destination_link || null,
      board_id: form.board_id || null,
      scheduled_at: form.scheduled_at
        ? new Date(form.scheduled_at).toISOString()
        : null,
    };

    const res = await fetch("/api/pins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Failed to create pin");
      return;
    }

    toast.success("Pin created");
    router.push("/dashboard");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Pin</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <Button
              type="button"
              variant={imageSource === "upload" ? "default" : "outline"}
              onClick={() => setImageSource("upload")}
            >
              Upload Image
            </Button>
            <Button
              type="button"
              variant={imageSource === "url" ? "default" : "outline"}
              onClick={() => setImageSource("url")}
            >
              Image URL
            </Button>
          </div>

          {imageSource === "upload" ? (
            <div>
              <Label htmlFor="file">Pin Image</Label>
              <Input
                id="file"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={loading}
              />
              {form.image_url && (
                <p className="mt-1 text-xs text-green-600">Image ready</p>
              )}
            </div>
          ) : (
            <div>
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                type="url"
                placeholder="https://..."
                value={form.image_url}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, image_url: e.target.value }))
                }
              />
            </div>
          )}

          <div>
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              required
              placeholder="e.g. Summer home decor ideas"
              value={form.topic}
              onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="keywords">Keywords</Label>
            <Textarea
              id="keywords"
              placeholder="home decor, summer, minimalist, ..."
              value={form.keywords}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, keywords: e.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="destination_link">Destination Link (optional)</Label>
            <Input
              id="destination_link"
              type="url"
              placeholder="https://yoursite.com/post"
              value={form.destination_link}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, destination_link: e.target.value }))
              }
            />
          </div>

          <div>
            <Label>Board</Label>
            <Select
              value={form.board_id}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, board_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a board" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {boards.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Connect Pinterest in Settings to sync boards.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="scheduled_at">Schedule (optional)</Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, scheduled_at: e.target.value }))
              }
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Pin"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
