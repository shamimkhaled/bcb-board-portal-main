import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  ["details", "Meeting Details", ""],
  ["participants", "Participants", "attendees"],
  ["agenda", "Agenda", "agenda"],
  ["board-pack", "Board Pack", "board-pack"],
  ["review", "Review", "edit"],
  ["publish", "Publish", "publish"]
] as const;

export function MeetingWorkflowSteps({ meetingId, active }: { meetingId: string; active: string }) {
  return (
    <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
      {steps.map(([key, label, route]) => (
        <Link
          key={key}
          href={route ? `/meetings/${meetingId}/${route}` : `/meetings/${meetingId}`}
          className={cn(
            "flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold text-bcb-ink hover:border-bcb-green",
            active === key && "border-bcb-green bg-emerald-50 text-emerald-900"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </div>
  );
}
