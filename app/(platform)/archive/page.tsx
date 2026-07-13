import { Archive, CheckCircle2, Database, ScanText } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { percent } from "@/lib/utils";
import { requireModule } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "archive");
  const records = await prisma.archiveRecord.findMany({
    orderBy: [{ year: "desc" }, { category: "asc" }],
    include: { document: true }
  });
  const years = [2022, 2023, 2024, 2025, 2026];
  const processed = records.filter((record) => record.ocrStatus !== "PENDING").length;
  const qcPassed = records.filter((record) => record.qcStatus === "PASSED").length;
  const locked = records.filter((record) => record.finalLocked).length;

  return (
    <PageShell
      eyebrow="Archive Digitization Pilot"
      title="Archive"
      description="Pilot archive module for 2022 to 2026 records with metadata tagging, simulated OCR text, QC status, physical file references, batch numbers, year-wise progress, and final archival lock."
    >
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Archive records" value={records.length} detail="Pilot batches across 2022-2026" icon={Archive} tone="navy" />
        <MetricCard label="OCR processed" value={`${percent(processed, records.length)}%`} detail="Simulated OCR status" icon={ScanText} tone="green" />
        <MetricCard label="QC passed" value={`${percent(qcPassed, records.length)}%`} detail="Quality control completion" icon={CheckCircle2} tone="gold" />
        <MetricCard label="Final locked" value={locked} detail="Archival lock applied" icon={Database} tone="red" />
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {years.map((year) => {
          const yearRecords = records.filter((record) => record.year === year);
          const completion = percent(yearRecords.reduce((sum, record) => sum + record.metadataComplete, 0), yearRecords.length * 100);
          return (
            <Card key={year}>
              <CardHeader>
                <CardTitle>{year}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-bcb-navy">{completion}%</p>
                <p className="mt-1 text-xs text-slate-500">{yearRecords.length} archive records</p>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-bcb-green" style={{ width: `${completion}%` }} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Archive Records</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 pr-4">Archive ID</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Year</th>
                <th className="py-3 pr-4">OCR</th>
                <th className="py-3 pr-4">QC</th>
                <th className="py-3 pr-4">Physical file</th>
                <th className="py-3 pr-4">Batch</th>
                <th className="py-3 pr-4">Metadata</th>
                <th className="py-3">Lock</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-semibold text-bcb-green">{record.archiveCode}</td>
                  <td className="py-3 pr-4 text-bcb-ink">{record.category}</td>
                  <td className="py-3 pr-4">{record.year}</td>
                  <td className="py-3 pr-4"><StatusBadge value={record.ocrStatus} /></td>
                  <td className="py-3 pr-4"><StatusBadge value={record.qcStatus} /></td>
                  <td className="py-3 pr-4">{record.physicalFileReference}</td>
                  <td className="py-3 pr-4">{record.batchNumber}</td>
                  <td className="py-3 pr-4">{record.metadataComplete}%</td>
                  <td className="py-3"><StatusBadge value={record.finalLocked ? "Locked" : "Open"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PageShell>
  );
}
