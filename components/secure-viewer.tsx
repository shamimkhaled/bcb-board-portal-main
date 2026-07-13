"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CheckCircle2, Download, Eye, FileText, LockKeyhole, Printer, ShieldAlert, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SecureViewerSessionPayload, ViewerAction } from "@/lib/secure-document-viewer";

type SecureViewerProps = {
  session: SecureViewerSessionPayload;
  initialRead?: boolean;
  initialAck?: boolean;
  compact?: boolean;
};

type ViewerPage = {
  pageNumber: number;
  content: string;
};

export function SecureViewer({ session, initialRead = false, initialAck = false, compact = false }: SecureViewerProps) {
  const [pages, setPages] = useState<ViewerPage[]>([]);
  const [pageCount, setPageCount] = useState(session.document.pageCount);
  const [nextStart, setNextStart] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "expired" | "error">("loading");
  const [message, setMessage] = useState("");
  const [read, setRead] = useState(initialRead);
  const [ack, setAck] = useState(initialAck);
  const [busy, setBusy] = useState<"read" | "ack" | null>(null);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const initialLoadStartedRef = useRef(false);

  const watermarkTiles = useMemo(() => {
    const density = Math.max(8, Math.min(48, session.watermark.policy.density));
    return Array.from({ length: density });
  }, [session.watermark.policy.density]);

  const loadPages = useCallback(async () => {
    if (state === "expired" || state === "error") return;
    if (nextStart >= pageCount && pages.length) return;

    setState((current) => (current === "ready" ? current : "loading"));
    const response = await fetch(`/api/secure-viewer/sessions/${session.publicTraceId}/pages?start=${nextStart}&count=2`);
    if (response.status === 410) {
      setState("expired");
      setMessage("This secure view session has expired. Refresh the page to create a new authorized session.");
      return;
    }
    if (!response.ok) {
      setState("error");
      setMessage("The secure document pages could not be loaded for this session.");
      return;
    }

    const payload = (await response.json()) as { pageCount: number; pages: ViewerPage[] };
    setPageCount(payload.pageCount);
    setPages((current) => {
      const seen = new Set(current.map((page) => page.pageNumber));
      return [...current, ...payload.pages.filter((page) => !seen.has(page.pageNumber))];
    });
    setNextStart(nextStart + payload.pages.length);
    setState("ready");
  }, [nextStart, pageCount, pages.length, session.publicTraceId, state]);

  useEffect(() => {
    if (initialLoadStartedRef.current) return;
    initialLoadStartedRef.current = true;
    void loadPages();
  }, [loadPages]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadPages();
      },
      { rootMargin: "500px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadPages]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        void recordAction("print");
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void recordAction("download");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [session.policy.download, session.policy.print]);

  async function mark(type: "read" | "ack") {
    setBusy(type);
    const endpoint =
      type === "read"
        ? `/api/documents/${session.document.id}/read`
        : `/api/documents/${session.document.id}/acknowledge`;
    const response = await fetch(endpoint, { method: "POST" });
    setBusy(null);
    if (!response.ok) {
      setMessage("Could not record the action. Check session and device status.");
      setState("error");
      return;
    }
    if (type === "read") setRead(true);
    if (type === "ack") setAck(true);
  }

  async function recordAction(action: Exclude<ViewerAction, "view">) {
    const permitted = Boolean(session.policy[action]);
    if (!permitted) {
      setMessage(`${action} is blocked by document policy for this session.`);
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/secure-viewer/sessions/${session.publicTraceId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (response.status === 410) {
        setState("expired");
        setMessage("This secure view session has expired. Refresh the page to continue.");
        return;
      }
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(payload?.error ?? `${action} is not permitted for this document.`);
        return;
      }
      setMessage(`${action} request recorded and permitted by policy.`);
    });
  }

  if (session.deviceStatus === "REVOKED") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-red-600" />
        <h2 className="mt-4 text-xl font-bold text-red-900">Viewer blocked</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-red-700">
          This device is revoked. The secure document viewer will not render protected board materials until an administrator restores device authorization.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border bg-white shadow-executive">
      <div className="theme-viewer-shell flex flex-col gap-3 border-b px-4 py-3 text-white md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold">{session.document.documentId}</Badge>
            <Badge variant="navy">{session.document.confidentiality}</Badge>
            <Badge variant="neutral">v{session.document.version}</Badge>
            <Badge variant="neutral">{session.publicTraceId}</Badge>
          </div>
          <h2 className="mt-2 truncate text-lg font-bold">{session.document.title}</h2>
          <p className="text-xs text-white/60">
            Session expires {new Date(session.expiresAt).toLocaleTimeString()} · {session.document.documentType}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton icon={Download} label="Download" allowed={session.policy.download} pending={isPending} onClick={() => recordAction("download")} />
          <ActionButton icon={Printer} label="Print" allowed={session.policy.print} pending={isPending} onClick={() => recordAction("print")} />
          <ActionButton icon={Share2} label="Share" allowed={session.policy.share} pending={isPending} onClick={() => recordAction("share")} />
        </div>
      </div>

      <div className={cn("relative overflow-auto bg-[color:var(--theme-viewer-background)] p-3 sm:p-5", compact ? "max-h-[620px]" : "max-h-[78vh] min-h-[680px]")}>
        {message ? (
          <div className="sticky top-2 z-30 mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 shadow">
            {message}
          </div>
        ) : null}

        {state === "expired" || state === "error" ? (
          <div className="mx-auto max-w-xl rounded-lg border bg-white p-8 text-center">
            <LockKeyhole className="mx-auto h-10 w-10 text-bcb-green" />
            <h3 className="mt-4 text-lg font-bold text-bcb-ink">{state === "expired" ? "Session expired" : "Viewer unavailable"}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
          </div>
        ) : null}

        <div className="mx-auto max-w-4xl space-y-5">
          {pages.map((page) => (
            <article key={page.pageNumber} className="theme-document-page relative min-h-[720px] overflow-hidden rounded-md border p-8 shadow-sm sm:p-12">
              <ForensicWatermark text={session.watermark.text} tiles={watermarkTiles} opacity={session.watermark.policy.opacity} enabled={session.watermark.policy.enabled} />
              <div className="relative z-10 select-none">
                <div className="mb-8 border-b pb-5">
                  <p className="text-xs font-bold uppercase text-bcb-green">Protected board material</p>
                  <h3 className="mt-2 text-2xl font-bold text-bcb-navy">{session.document.title}</h3>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Page {page.pageNumber} of {pageCount} · Trace {session.publicTraceId}
                  </p>
                </div>
                <p className="whitespace-pre-line text-base leading-8 text-slate-800">{page.content}</p>
              </div>
            </article>
          ))}
          {state === "loading" ? (
            <div className="rounded-md border border-dashed bg-white p-6 text-center text-sm font-semibold text-slate-500">
              Loading protected pages...
            </div>
          ) : null}
          <div ref={sentinelRef} className="h-8" />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <LockKeyhole className="h-4 w-4 text-bcb-green" />
          Server-side authorization and audit logging enabled
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={read ? "outline" : "default"} onClick={() => mark("read")} disabled={read || busy !== null}>
            {read ? <CheckCircle2 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {read ? "Read logged" : busy === "read" ? "Logging..." : "Mark as Read"}
          </Button>
          <Button variant={ack ? "outline" : "gold"} onClick={() => mark("ack")} disabled={ack || busy !== null}>
            <CheckCircle2 className="h-4 w-4" />
            {ack ? "Acknowledged" : busy === "ack" ? "Recording..." : "Acknowledge"}
          </Button>
          {session.policy.annotate ? (
            <Button variant="outline" onClick={() => recordAction("annotate")} disabled={isPending}>
              <FileText className="h-4 w-4" />
              Annotate
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ForensicWatermark({
  text,
  tiles,
  opacity,
  enabled
}: {
  text: string;
  tiles: unknown[];
  opacity: number;
  enabled: boolean;
}) {
  if (!enabled) return null;
  return (
    <div className="pointer-events-none absolute inset-[-18%] z-20 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" aria-hidden="true">
      {tiles.map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-center whitespace-nowrap text-[10px] font-black uppercase tracking-normal sm:text-xs"
          style={{
            transform: "rotate(-35deg)",
            opacity: opacity / 100,
            color: "var(--theme-watermark-colour)"
          }}
        >
          {text}
        </div>
      ))}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  allowed,
  pending,
  onClick
}: {
  icon: typeof Download;
  label: string;
  allowed: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      size="sm"
      variant={allowed ? "outline" : "ghost"}
      onClick={onClick}
      disabled={pending || !allowed}
      title={allowed ? label : `${label} blocked by policy`}
    >
      <Icon className="h-4 w-4" />
      {allowed ? label : `${label} denied`}
    </Button>
  );
}
