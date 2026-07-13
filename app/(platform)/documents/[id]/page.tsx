import { notFound } from "next/navigation";
import { RequestAccessButton } from "@/components/request-access-button";
import { SecureViewer } from "@/components/secure-viewer";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { getServerMeta, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confidentiality, statusLabel } from "@/lib/labels";
import { formatDate, formatDateTime } from "@/lib/utils";
import { hasDocumentContentAccess, hasDocumentMetadataAccess, requireModule } from "@/lib/permissions";
import { auditViewerEvent, createSecureViewSession } from "@/lib/secure-document-viewer";

export const dynamic = "force-dynamic";

export default async function DocumentViewerPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAuth();
  await requireModule(auth.user, "documents");
  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      uploadedBy: true,
      approvedBy: true,
      versions: { orderBy: { createdAt: "desc" } },
      accessRequests: { include: { requestedBy: true, approvedBy: true }, orderBy: { createdAt: "desc" } },
      readAcknowledgments: { include: { user: true }, orderBy: { createdAt: "desc" } }
    }
  });

  if (!document) notFound();
  const serverMeta = await getServerMeta();
  const [metadataAllowed, contentAllowed] = await Promise.all([
    hasDocumentMetadataAccess(auth.user, document),
    hasDocumentContentAccess(auth.user, document)
  ]);
  if (!metadataAllowed || !contentAllowed) {
    await auditViewerEvent(
      auth,
      document,
      "DOCUMENT_VIEW_DENIED",
      "Denied",
      "Direct document route authorization failed.",
      serverMeta,
      { documentRouteId: id, metadataAllowed, contentAllowed }
    );
    notFound();
  }

  const initialRead = document.readAcknowledgments.some((ack) => ack.userId === auth.user.id && ack.type === "READ");
  const initialAck = document.readAcknowledgments.some((ack) => ack.userId === auth.user.id && ack.type === "ACK");
  const viewerSession = await createSecureViewSession(auth, document, { type: "document", id: document.id }, serverMeta).catch(() => null);
  if (!viewerSession) notFound();

  return (
    <PageShell
      eyebrow="Secure Document Viewer"
      title={document.title}
      description={`${document.documentId} · ${document.documentType} · ${confidentiality(document.confidentiality)}`}
      actions={<RequestAccessButton documentId={document.id} />}
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <SecureViewer
          session={viewerSession}
          initialRead={initialRead}
          initialAck={initialAck}
        />

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ["Official date", formatDate(document.officialDate)],
                ["Department / Office", document.departmentOffice],
                ["Retention", statusLabel(document.retentionStatus)],
                ["OCR", statusLabel(document.ocrStatus)],
                ["QC", statusLabel(document.qcStatus)],
                ["Physical reference", document.physicalFileReference],
                ["Uploaded by", document.uploadedBy.name],
                ["Approved by", document.approvedBy?.name ?? "Pending approval"],
                ["Access expiry", formatDateTime(document.accessExpiryDate)]
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 border-b pb-2 last:border-0">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-right font-semibold text-bcb-ink">{value}</span>
                </div>
              ))}
              <StatusBadge value={document.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {document.versions.map((version) => (
                <div key={version.id} className="rounded-lg border bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-bcb-ink">Version {version.version}</p>
                  <p className="text-xs text-slate-500">{version.fileName}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{version.changeNote}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Access and Read Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {document.readAcknowledgments.slice(0, 6).map((ack) => (
                <div key={ack.id} className="rounded-lg border bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-bcb-ink">{ack.user.name}</p>
                    <StatusBadge value={ack.type} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(ack.createdAt)}</p>
                </div>
              ))}
              {document.accessRequests.slice(0, 4).map((request) => (
                <div key={request.id} className="rounded-lg border bg-amber-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-amber-950">{request.requestCode}</p>
                    <StatusBadge value={request.status} />
                  </div>
                  <p className="mt-1 text-xs text-amber-900">{request.requestedBy.name}: {request.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
