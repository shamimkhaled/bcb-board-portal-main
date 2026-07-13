import { Badge } from "@/components/ui/badge";
import { badgeTone, statusLabel } from "@/lib/labels";

export function StatusBadge({ value }: { value: string }) {
  return <Badge variant={badgeTone(value)}>{statusLabel(value)}</Badge>;
}
