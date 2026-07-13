import { DocumentSearchPanel, type SearchResultItem } from "@/components/search/document-search-panel";
import { requireAuth } from "@/lib/auth";
import { role } from "@/lib/labels";
import { requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function scoreMatch(haystack: string, needle: string) {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (!n) return 0;
  if (h === n) return 1;
  if (h.includes(n)) return Math.min(0.95, n.length / Math.max(h.length, 1) + 0.2);
  const parts = n.split(/\s+/).filter(Boolean);
  const hits = parts.filter((part) => h.includes(part)).length;
  return hits / Math.max(parts.length, 1) * 0.55;
}

export default async function SearchPage({
  searchParams
}: {
  searchParams?: Promise<{
    mode?: string;
    q?: string;
    documentId?: string;
    documentType?: string;
    uploadedBy?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const auth = await requireAuth();
  await requireModule(auth.user, "search");
  const params = (await searchParams) ?? {};
  const mode = params.mode === "metadata" ? "metadata" : "keyword";
  const q = params.q?.trim() ?? "";

  const documents = await prisma.document.findMany({
    include: { uploadedBy: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  let results: SearchResultItem[] = [];

  if (mode === "keyword" && q) {
    results = documents
      .map((document) => {
        const keywordScore = scoreMatch(`${document.keywords} ${document.title} ${document.documentId}`, q);
        const summaryScore = scoreMatch(document.simulatedOcrText, q);
        const score = Math.max(keywordScore, summaryScore * 0.9);
        if (score <= 0) return null;
        const item: SearchResultItem = {
          id: document.id,
          documentId: document.documentId,
          title: document.title,
          documentType: document.documentType,
          keywords: document.keywords,
          matchType: summaryScore > keywordScore ? "summary" : "keyword",
          score,
          uploadedBy: document.uploadedBy.name,
          uploadedAt: formatDate(document.createdAt)
        };
        return item;
      })
      .filter((item): item is SearchResultItem => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);
  }

  if (mode === "metadata") {
    const dateFrom = params.dateFrom ? new Date(params.dateFrom) : null;
    const dateTo = params.dateTo ? new Date(params.dateTo) : null;
    const hasMeta =
      Boolean(params.documentId?.trim()) ||
      Boolean(params.documentType?.trim()) ||
      Boolean(params.uploadedBy?.trim()) ||
      Boolean(params.dateFrom) ||
      Boolean(params.dateTo);

    if (hasMeta) {
      results = documents
        .filter((document) => {
          if (params.documentId && !document.documentId.toLowerCase().includes(params.documentId.toLowerCase())) {
            return false;
          }
          if (params.documentType && !document.documentType.toLowerCase().includes(params.documentType.toLowerCase())) {
            return false;
          }
          if (
            params.uploadedBy &&
            !document.uploadedBy.name.toLowerCase().includes(params.uploadedBy.toLowerCase()) &&
            !document.uploadedBy.email.toLowerCase().includes(params.uploadedBy.toLowerCase())
          ) {
            return false;
          }
          if (dateFrom && document.createdAt < dateFrom) return false;
          if (dateTo) {
            const end = new Date(dateTo);
            end.setHours(23, 59, 59, 999);
            if (document.createdAt > end) return false;
          }
          return true;
        })
        .map((document) => ({
          id: document.id,
          documentId: document.documentId,
          title: document.title,
          documentType: document.documentType,
          keywords: document.keywords,
          matchType: "metadata" as const,
          score: 1,
          uploadedBy: document.uploadedBy.name,
          uploadedAt: formatDate(document.createdAt)
        }));
    }
  }

  return (
    <DocumentSearchPanel
      initialMode={mode}
      initialQuery={q}
      initialMeta={{
        documentId: params.documentId ?? "",
        documentType: params.documentType ?? "",
        uploadedBy: params.uploadedBy ?? "",
        dateFrom: params.dateFrom ?? "",
        dateTo: params.dateTo ?? ""
      }}
      results={results}
      signedInLabel={`Signed in as ${auth.user.name.split(" ")[0]?.toLowerCase() ?? "user"} · ${role(auth.user.role)}`}
    />
  );
}
