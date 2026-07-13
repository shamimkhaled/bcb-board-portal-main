"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";

type Item = { id: string; itemNumber: number; title: string; summary: string; presenter: string; responsibleDepartment: string; estimatedDuration: number; decisionType: string; confidentiality: string; secretaryNotes: string; status: string; memoId: string | null; memo: { id: string; memoId: string; title: string } | null; documents: { document: { id: string; documentId: string; title: string } }[] };
type Option = { id: string; label: string };
type Permissions = { create: boolean; edit: boolean; delete: boolean; reorder: boolean; attachDocument: boolean; linkMemo: boolean; submit: boolean };

export function AgendaBuilder({ meetingId, items, documents, memos, editable, permissions }: { meetingId: string; items: Item[]; documents: Option[]; memos: Option[]; editable: boolean; permissions: Permissions }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Item | null | "new">(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const canAdd = editable && permissions.create;

  async function request(url: string, method: string, body?: unknown) {
    setBusy(true); setMessage("");
    const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const payload = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(payload.error || "Action failed."); return false; }
    setEditing(null); router.refresh(); return true;
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const body = { ...Object.fromEntries(formData.entries()), documentIds: formData.getAll("documentIds").map(String) };
    const item = editing === "new" ? null : editing;
    await request(item ? `/api/meetings/${meetingId}/agenda/${item.id}` : `/api/meetings/${meetingId}/agenda`, item ? "PATCH" : "POST", body);
  }
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
      <div><h2 className="text-lg font-bold text-bcb-navy">Agenda Builder</h2><p className="text-sm text-slate-500">{editable ? "Prepare and order the meeting agenda." : "This agenda is view-only in the current meeting status."}</p></div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => window.open(`/meetings/${meetingId}/agenda/preview`, "_blank")}>Preview Agenda</Button>
        {editable && permissions.submit ? <Button type="button" variant="outline" disabled={busy || !items.length} onClick={() => request(`/api/meetings/${meetingId}/agenda`, "POST", { intent: "submit" })}>Submit for Chairman Review</Button> : null}
        {canAdd ? <Button type="button" onClick={() => setEditing("new")}>Add Agenda Item</Button> : null}
      </div>
    </div>
    <div className="space-y-3 p-6">
      {message ? <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-900">{message}</p> : null}
      {!items.length ? <div className="rounded-lg border border-dashed p-8 text-center"><p className="font-semibold text-bcb-ink">No agenda items yet.</p><p className="mt-1 text-sm text-slate-500">Create the first agenda item to start preparing this meeting.</p>{canAdd ? <Button className="mt-4" type="button" onClick={() => setEditing("new")}>Add Agenda Item</Button> : null}</div> : null}
      {items.map((item, index) => <article key={item.id} className="rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-bcb-green">Item {item.itemNumber} · {item.decisionType.replaceAll("_", " ")}</p><h3 className="text-lg font-bold text-bcb-ink">{item.title}</h3></div><StatusBadge value={item.status} /></div>
        <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
        <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-4"><span><b>Presenter:</b> {item.presenter}</span><span><b>Duration:</b> {item.estimatedDuration} min</span><span><b>Confidentiality:</b> {item.confidentiality.replaceAll("_", " ")}</span><span><b>Attachments:</b> {item.documents.length}</span></div>
        <p className="mt-2 text-sm"><b>Related memo:</b> {item.memo ? `${item.memo.memoId} — ${item.memo.title}` : "None"}</p>
        {editable ? <div className="mt-4 flex flex-wrap gap-2">
          {permissions.edit ? <Button size="sm" variant="outline" onClick={() => setEditing(item)}>Edit</Button> : null}
          {permissions.delete ? <Button size="sm" variant="outline" onClick={() => confirm(`Delete agenda item ${item.itemNumber}?`) && request(`/api/meetings/${meetingId}/agenda/${item.id}`, "DELETE")}>Delete</Button> : null}
          {permissions.reorder ? <><Button size="sm" variant="outline" disabled={index === 0} onClick={() => request(`/api/meetings/${meetingId}/agenda/${item.id}`, "PATCH", { intent: "reorder", direction: "up" })}>Move Up</Button><Button size="sm" variant="outline" disabled={index === items.length - 1} onClick={() => request(`/api/meetings/${meetingId}/agenda/${item.id}`, "PATCH", { intent: "reorder", direction: "down" })}>Move Down</Button></> : null}
          {permissions.attachDocument ? <SelectAction label="Attach Document" options={documents.filter((d) => !item.documents.some((link) => link.document.id === d.id))} onSelect={(documentId) => request(`/api/meetings/${meetingId}/agenda/${item.id}`, "PATCH", { intent: "attach", documentId })} /> : null}
          {permissions.linkMemo ? <SelectAction label="Link Memo" options={memos} onSelect={(memoId) => request(`/api/meetings/${meetingId}/agenda/${item.id}`, "PATCH", { intent: "linkMemo", memoId })} /> : null}
        </div> : null}
      </article>)}
    </div>
    {editing ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true"><form onSubmit={save} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"><div className="flex justify-between"><h2 className="text-xl font-bold">{editing === "new" ? "Add Agenda Item" : "Edit Agenda Item"}</h2><button type="button" aria-label="Close" onClick={() => setEditing(null)}>✕</button></div><AgendaFields item={editing === "new" ? null : editing} memos={memos} documents={documents} includeDocuments={editing === "new"} /><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={busy} type="submit">{busy ? "Saving..." : "Save Agenda Item"}</Button></div></form></div> : null}
  </>;
}

function AgendaFields({ item, memos, documents, includeDocuments }: { item: Item | null; memos: Option[]; documents: Option[]; includeDocuments: boolean }) {
  return <div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Title"><Input name="title" defaultValue={item?.title} required /></Field><Field label="Presenter"><Input name="presenter" defaultValue={item?.presenter} required /></Field><div className="md:col-span-2"><Field label="Summary"><Textarea name="summary" defaultValue={item?.summary} required /></Field></div><Field label="Responsible department"><Input name="responsibleDepartment" defaultValue={item?.responsibleDepartment} required /></Field><Field label="Estimated duration (minutes)"><Input name="estimatedDuration" type="number" min="1" max="1440" defaultValue={item?.estimatedDuration || 15} required /></Field><Field label="Decision type"><select className="h-10 w-full rounded-md border px-3" name="decisionType" defaultValue={item?.decisionType || "INFORMATION"}>{["INFORMATION","DISCUSSION","DECISION","APPROVAL","RATIFICATION"].map(v => <option key={v}>{v}</option>)}</select></Field><Field label="Confidentiality"><select className="h-10 w-full rounded-md border px-3" name="confidentiality" defaultValue={item?.confidentiality || "INTERNAL"}>{["PUBLIC","INTERNAL","RESTRICTED","CONFIDENTIAL","HIGHLY_CONFIDENTIAL"].map(v => <option key={v}>{v}</option>)}</select></Field><Field label="Related memo"><select className="h-10 w-full rounded-md border px-3" name="memoId" defaultValue={item?.memoId || ""}><option value="">None</option>{memos.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></Field>{includeDocuments ? <Field label="Supporting documents"><select multiple className="min-h-24 w-full rounded-md border px-3 py-2" name="documentIds">{documents.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></Field> : <div /> }<div className="md:col-span-2"><Field label="Secretary notes"><Textarea name="secretaryNotes" defaultValue={item?.secretaryNotes} /></Field></div></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-bcb-ink">{label}<div className="mt-1.5">{children}</div></label>; }
function SelectAction({ label, options, onSelect }: { label: string; options: Option[]; onSelect: (id: string) => void }) { return <select aria-label={label} className="h-9 rounded-md border bg-white px-2 text-sm" defaultValue="" onChange={(e) => { if (e.target.value) onSelect(e.target.value); e.target.value = ""; }}><option value="">{label}</option>{options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select>; }
