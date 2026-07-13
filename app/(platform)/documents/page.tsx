import Link from "next/link";
import { FileSearch, FileText, LockKeyhole } from "lucide-react";
import { DocumentUploadForm } from "@/components/document-upload-form";
import { MetricCard } from "@/components/metric-card";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confidentiality } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { hasPermission, requireModule } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; year?: string; type?: string }>;
}) {
  const auth = await requireAuth();
  await requireModule(auth.user, "documents");
  const canUpload = await hasPermission(auth.user, "documents", "upload");
  const params = await searchParams;
  const q = params.q?.trim();
  const year = params.year ? Number(params.year) : undefined;
  const type = params.type?.trim();

  const documents = await prisma.document.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q } },
                { keywords: { contains: q } },
                { documentId: { contains: q } }
              ]
            }
          : {},
        year ? { year } : {},
        type ? { documentType: type } : {}
      ]
    },
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    include: {
      uploadedBy: true,
      approvedBy: true,
      committee: true,
      versions: true,
      accessRequests: true
    }
  });

  const restricted = documents.filter((document) => ["RESTRICTED", "CONFIDENTIAL", "HIGHLY_CONFIDENTIAL"].includes(document.confidentiality)).length;

  return (
    <PageShell
      eyebrow="Document Repository"
      title="Documents"
      description="Upload, classify, search, version, lock, and audit board papers, AGM records, notices, agendas, minutes, resolutions, memos, legal files, and archive documents."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Repository records" value={documents.length} detail="Search result count" icon={FileText} tone="navy" />
        <MetricCard label="Restricted or higher" value={restricted} detail="Access request controls available" icon={LockKeyhole} tone="red" />
        <MetricCard label="Version records" value={documents.reduce((sum, document) => sum + document.versions.length, 0)} detail="Draft and final history" icon={FileSearch} tone="green" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Register Upload</CardTitle>
            </CardHeader>
            <CardContent>
              {canUpload ? <DocumentUploadForm /> : <p className="text-sm leading-6 text-slate-600">You can view repository metadata, but document upload is not enabled for your role.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Search Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3">
                <input
                  name="q"
                  defaultValue={q}
                  className="min-h-11 w-full rounded-xl border bg-white px-3 text-sm"
                  placeholder="Keyword, document ID, title"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    name="year"
                    defaultValue={params.year}
                    className="min-h-11 rounded-xl border bg-white px-3 text-sm"
                    placeholder="Year"
                  />
                  <input
                    name="type"
                    defaultValue={type}
                    className="min-h-11 rounded-xl border bg-white px-3 text-sm"
                    placeholder="Type"
                  />
                </div>
                <button className="min-h-11 w-full rounded-xl bg-[#006A4E] text-sm font-semibold text-white">
                  Search repository
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          {documents.map((document) => (
            <Link
              key={document.id}
              href={`/documents/${document.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#006A4E]/50 active:scale-[0.99] lg:rounded-lg"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase text-bcb-green">{document.documentId}</span>
                    <StatusBadge value={document.status} />
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{confidentiality(document.confidentiality)}</span>
                  </div>
                  <p className="mt-2 text-base font-bold text-bcb-navy">{document.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{document.documentType} · {document.year} · {formatDate(document.officialDate)}</p>
                </div>
                <div className="text-sm text-slate-500 lg:text-right">
                  <p>Uploaded by {document.uploadedBy.name}</p>
                  <p>Approved by {document.approvedBy?.name ?? "Pending"}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">OCR {document.ocrStatus}</span>
                <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">QC {document.qcStatus}</span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Physical {document.physicalFileReference}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
