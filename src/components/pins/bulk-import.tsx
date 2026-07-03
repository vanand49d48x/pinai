"use client";

import { useState } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HEADERS = ["image_url", "topic", "keywords", "link", "board_name", "scheduled_at"];

interface ParsedRow {
  image_url: string;
  topic: string;
  keywords: string;
  link: string;
  board_name: string;
  scheduled_at: string;
  valid: boolean;
  reason?: string;
}

function validateRow(row: ParsedRow): ParsedRow {
  if (!row.image_url?.trim()) return { ...row, valid: false, reason: "Missing image_url" };
  if (!row.topic?.trim()) return { ...row, valid: false, reason: "Missing topic" };
  try {
    new URL(row.image_url.trim());
  } catch {
    return { ...row, valid: false, reason: "Invalid image_url" };
  }
  if (row.scheduled_at?.trim()) {
    const d = new Date(row.scheduled_at.trim());
    if (isNaN(d.getTime())) return { ...row, valid: false, reason: "Bad date format" };
  }
  if (row.link?.trim()) {
    try {
      new URL(row.link.trim());
    } catch {
      return { ...row, valid: false, reason: "Invalid link URL" };
    }
  }
  return { ...row, valid: true };
}

export function BulkImport() {
  const router = useRouter();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [genProgress, setGenProgress] = useState<{ current: number; total: number } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        if (HEADERS.some((h) => !headers.includes(h))) {
          toast.error(`CSV must include columns: ${HEADERS.join(", ")}`);
          return;
        }
        const parsed = results.data.map((row) =>
          validateRow({ ...row, valid: true })
        );
        setRows(parsed);
        setImportedIds([]);
      },
    });
  }

  async function handleImport() {
    const valid = rows.filter((r) => r.valid);
    if (valid.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setLoading(true);
    const pins = valid.map((row) => ({
      image_url: row.image_url.trim(),
      topic: row.topic.trim(),
      keywords: row.keywords?.trim() ?? "",
      destination_link: row.link?.trim() || null,
      board_name: row.board_name?.trim() || undefined,
      scheduled_at: row.scheduled_at?.trim() || null,
    }));

    const res = await fetch("/api/pins/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pins }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Import failed");
      return;
    }

    const data = await res.json();
    const skipped = rows.length - valid.length;
    setImportedIds(data.pins.map((p: { id: string }) => p.id));
    toast.success(
      `${data.count} imported${skipped > 0 ? `, ${skipped} skipped (see reasons)` : ""}`
    );
  }

  async function handleGenerateAll() {
    if (importedIds.length === 0) return;
    setGenProgress({ current: 0, total: importedIds.length });

    for (let i = 0; i < importedIds.length; i++) {
      setGenProgress({ current: i + 1, total: importedIds.length });
      await fetch(`/api/pins/${importedIds[i]}/generate`, { method: "POST" });
      if (i < importedIds.length - 1) await new Promise((r) => setTimeout(r, 1500));
    }

    setGenProgress(null);
    toast.success(`Generated AI copy for ${importedIds.length} pins`);
    router.push("/dashboard");
  }

  const validCount = rows.filter((r) => r.valid).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk import</CardTitle>
        <CardDescription>Import multiple pins from CSV</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/bulk-import-template.csv" download>
              <Download className="mr-2 h-4 w-4" />
              Download CSV template
            </a>
          </Button>
          <label htmlFor="csv-upload">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Choose CSV
              </span>
            </Button>
          </label>
          <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>

        {rows.length > 0 && (
          <>
            <div className="max-h-56 overflow-auto rounded border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80">
                  <tr>
                    <th className="px-2 py-1 text-left">Topic</th>
                    <th className="px-2 py-1 text-left">Board</th>
                    <th className="px-2 py-1 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1">{row.topic || "—"}</td>
                      <td className="px-2 py-1">{row.board_name || "—"}</td>
                      <td className="px-2 py-1">
                        {row.valid ? (
                          <Badge variant="ready">Valid</Badge>
                        ) : (
                          <Badge variant="failed">{row.reason}</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={handleImport} disabled={loading || validCount === 0}>
              {loading ? "Importing..." : `Import ${validCount} valid row${validCount !== 1 ? "s" : ""}`}
            </Button>
          </>
        )}

        {importedIds.length > 0 && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">Imported {importedIds.length} drafts</p>
            {genProgress && (
              <div className="space-y-1">
                <Progress value={(genProgress.current / genProgress.total) * 100} />
                <p className="text-xs text-muted-foreground">
                  Generating {genProgress.current} of {genProgress.total}...
                </p>
              </div>
            )}
            <Button onClick={handleGenerateAll} disabled={Boolean(genProgress)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI copy for all {importedIds.length}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
