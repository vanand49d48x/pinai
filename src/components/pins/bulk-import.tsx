"use client";

import { useState } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const REQUIRED_COLUMNS = ["image_url", "topic", "keywords", "link", "board_name", "scheduled_at"];

interface CsvRow {
  image_url: string;
  topic: string;
  keywords: string;
  link: string;
  board_name: string;
  scheduled_at: string;
}

export function BulkImport() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));

        if (missing.length > 0) {
          setErrors([`Missing columns: ${missing.join(", ")}`]);
          setPreview([]);
          return;
        }

        const rowErrors: string[] = [];
        const validRows: CsvRow[] = [];

        results.data.forEach((row, i) => {
          if (!row.image_url?.trim()) {
            rowErrors.push(`Row ${i + 2}: missing image_url`);
            return;
          }
          if (!row.topic?.trim()) {
            rowErrors.push(`Row ${i + 2}: missing topic`);
            return;
          }
          try {
            if (row.image_url) new URL(row.image_url);
          } catch {
            rowErrors.push(`Row ${i + 2}: invalid image_url`);
            return;
          }
          validRows.push(row);
        });

        setErrors(rowErrors);
        setPreview(validRows);
      },
      error: (err) => {
        toast.error(err.message);
      },
    });
  }

  async function handleImport() {
    if (preview.length === 0) return;

    setLoading(true);

    const pins = preview.map((row) => ({
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
    toast.success(`Imported ${data.count} pins as drafts`);
    router.push("/dashboard");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Import</CardTitle>
        <CardDescription>
          Upload a CSV with columns: image_url, topic, keywords, link, board_name, scheduled_at
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <Button variant="outline" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Choose CSV File
              </span>
            </Button>
          </label>
        </div>

        {errors.length > 0 && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {errors.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        )}

        {preview.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              {preview.length} valid rows ready to import
            </p>
            <div className="max-h-48 overflow-auto rounded border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-2 py-1 text-left">Topic</th>
                    <th className="px-2 py-1 text-left">Board</th>
                    <th className="px-2 py-1 text-left">Scheduled</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1">{row.topic}</td>
                      <td className="px-2 py-1">{row.board_name || "—"}</td>
                      <td className="px-2 py-1">{row.scheduled_at || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 10 && (
                <p className="p-2 text-xs text-muted-foreground">
                  ...and {preview.length - 10} more
                </p>
              )}
            </div>
            <Button onClick={handleImport} disabled={loading}>
              {loading ? "Importing..." : `Import ${preview.length} Pins`}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
