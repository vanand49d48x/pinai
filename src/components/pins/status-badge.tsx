import type { PinStatus } from "@/types/database";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<PinStatus, string> = {
  draft: "Draft",
  generating: "Generating",
  ready: "Ready",
  scheduled: "Scheduled",
  publishing: "Publishing",
  posted: "Posted",
  failed: "Failed",
};

export function StatusBadge({ status }: { status: PinStatus }) {
  return (
    <Badge variant={status as "draft" | "generating" | "ready" | "scheduled" | "publishing" | "posted" | "failed"}>
      {statusLabels[status]}
    </Badge>
  );
}
