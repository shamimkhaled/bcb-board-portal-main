"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchResultItem = {
  id: string;
  documentId: string;
  title: string;
  documentType: string;
  keywords: string;
  matchType: "keyword" | "summary" | "metadata";
  score: number;
  uploadedBy: string;
  uploadedAt: string;
};

type DocumentSearchPanelProps = {
  initialMode: "keyword" | "metadata";
  initialQuery: string;
  initialMeta: {
    documentId: string;
    documentType: string;
    uploadedBy: string;
    dateFrom: string;
    dateTo: string;
  };
  results: SearchResultItem[];
  signedInLabel: string;
};

export function DocumentSearchPanel({
  initialMode,
  initialQuery,
  initialMeta,
  results,
  signedInLabel
}: DocumentSearchPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"keyword" | "metadata">(initialMode);

  const hasQuery = useMemo(() => {
    if (mode === "keyword") return Boolean(initialQuery.trim());
    return Boolean(
      initialMeta.documentId ||
        initialMeta.documentType ||
        initialMeta.uploadedBy ||
        initialMeta.dateFrom ||
        initialMeta.dateTo
    );
  }, [initialMeta, initialQuery, mode]);

  function submitKeyword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = String(formData.get("q") ?? "").trim();
    const params = new URLSearchParams();
    params.set("mode", "keyword");
    if (q) params.set("q", q);
    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  function submitMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    params.set("mode", "metadata");
    for (const key of ["documentId", "documentType", "uploadedBy", "dateFrom", "dateTo"] as const) {
      const value = String(formData.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-bcb-ink sm:text-3xl">Search Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search both extracted keywords and document summary content for related files.
          </p>
        </div>
        <div className="inline-flex self-start rounded-full bg-[color:var(--theme-navigation-active)] px-3 py-1.5 text-xs font-semibold text-primary">
          {signedInLabel}
        </div>
      </div>

      <div className="rounded-ds-xl border border-slate-200/80 bg-white p-4 shadow-ds sm:p-5">
        <div className="mb-4 flex gap-2">
          {(
            [
              ["keyword", "Keyword Search"],
              ["metadata", "Metadata Search"]
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                "min-h-11 rounded-ds px-4 text-sm font-semibold transition",
                mode === value
                  ? "bg-[color:var(--theme-navigation-active)] text-primary"
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "keyword" ? (
          <form onSubmit={submitKeyword} className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                name="q"
                defaultValue={initialQuery}
                placeholder="Enter keyword or document summary phrase"
                className="min-h-11 w-full flex-1 rounded-ds border border-slate-200 bg-white px-3 text-sm"
              />
              <button
                type="submit"
                disabled={pending}
                className="min-h-11 rounded-ds bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
              >
                Search
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={submitMetadata} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-semibold text-[#0a4d3c]">
                <span>Document ID</span>
                <input
                  name="documentId"
                  defaultValue={initialMeta.documentId}
                  placeholder="e.g. BCP-2026-001"
                  className="min-h-11 w-full rounded-ds border border-slate-200 px-3 text-sm font-normal"
                />
              </label>
              <label className="space-y-1 text-sm font-semibold text-[#0a4d3c]">
                <span>Document Type</span>
                <input
                  name="documentType"
                  defaultValue={initialMeta.documentType}
                  placeholder="e.g. Minutes, Budget"
                  className="min-h-11 w-full rounded-ds border border-slate-200 px-3 text-sm font-normal"
                />
              </label>
              <label className="space-y-1 text-sm font-semibold text-[#0a4d3c]">
                <span>Uploaded By</span>
                <input
                  name="uploadedBy"
                  defaultValue={initialMeta.uploadedBy}
                  placeholder="Username"
                  className="min-h-11 w-full rounded-ds border border-slate-200 px-3 text-sm font-normal"
                />
              </label>
              <label className="space-y-1 text-sm font-semibold text-[#0a4d3c]">
                <span>Date From</span>
                <input
                  name="dateFrom"
                  type="date"
                  defaultValue={initialMeta.dateFrom}
                  className="min-h-11 w-full rounded-ds border border-slate-200 px-3 text-sm font-normal"
                />
              </label>
              <label className="space-y-1 text-sm font-semibold text-[#0a4d3c] sm:col-span-2">
                <span>Date To</span>
                <input
                  name="dateTo"
                  type="date"
                  defaultValue={initialMeta.dateTo}
                  className="min-h-11 w-full rounded-ds border border-slate-200 px-3 text-sm font-normal"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 w-full rounded-ds bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
            >
              Search
            </button>
          </form>
        )}

        {!hasQuery ? (
          <p className="mt-4 text-sm text-slate-400">Search results will appear here after you submit a query.</p>
        ) : null}
      </div>

      {hasQuery ? (
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-600">No documents matched this query.</p>
            </div>
          ) : (
            results.map((item) => (
              <Link
                key={item.id}
                href={`/documents/${item.id}`}
                className="block rounded-ds-lg border border-slate-200 bg-white p-4 shadow-ds transition hover:border-primary/30 hover:shadow-ds-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-base font-bold text-bcb-ink">{item.documentId}</h2>
                  <span className="shrink-0 text-xs font-medium capitalize text-slate-500">{item.documentType}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-700">{item.title}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>
                    Match type: <strong className="text-slate-700">{item.matchType}</strong>
                  </span>
                  <span>
                    Score: <strong className="text-slate-700">{item.score.toFixed(3)}</strong>
                  </span>
                </div>
                {item.keywords ? (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    <span className="font-semibold text-slate-600">Keywords: </span>
                    {item.keywords}
                  </p>
                ) : null}
              </Link>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
