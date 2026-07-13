import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { requireModule } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const steps = [
  ["Step 1", "Department submits board memo", "/memo-workflow"],
  ["Step 2", "Secretary reviews memo", "/memo-workflow"],
  ["Step 3", "Chairman approves memo", "/memo-workflow"],
  ["Step 4", "Secretary creates board meeting", "/meetings"],
  ["Step 5", "Secretary attaches approved memo to agenda", "/meetings"],
  ["Step 6", "Secretary publishes board pack", "/board-packs"],
  ["Step 7", "Director views secure document with watermark", "/documents/doc-001"],
  ["Step 8", "Director acknowledges board pack", "/board-packs/pack-board-12"],
  ["Step 9", "Secretary drafts minutes", "/minutes"],
  ["Step 10", "Chairman approves minutes", "/minutes"],
  ["Step 11", "Resolution is generated", "/resolutions"],
  ["Step 12", "Action item is assigned", "/action-items"],
  ["Step 13", "Admin views audit trail", "/audit-logs"]
];

export default async function DemoJourneyPage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "demo-journey");

  return (
    <PageShell
      eyebrow="Executive Demo Mode"
      title="Demo Journey"
      description="A guided, clickable proof that the MVP can move from department memo submission through board pack publication, secure viewing, acknowledgment, minutes, resolutions, action items, and audit evidence."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {steps.map(([step, title, href], index) => (
          <Link key={step} href={href} className="group block">
            <Card className="h-full transition hover:border-bcb-green hover:shadow-executive">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bcb-green text-sm font-bold text-white">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase text-bcb-green">{step}</p>
                  <p className="mt-1 font-semibold text-bcb-ink">{title}</p>
                </div>
                {index < steps.length - 1 ? (
                  <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:text-bcb-green" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-bcb-green" />
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
