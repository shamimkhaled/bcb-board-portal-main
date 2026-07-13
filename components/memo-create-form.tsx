"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function MemoCreateForm() {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/memos/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(payload.error || "Could not create memo.");
      return;
    }
    ref.current?.reset();
    setMessage(`Created ${payload.memoId}`);
    router.refresh();
  }

  return (
    <form ref={ref} className="grid gap-3 rounded-lg border bg-white p-4" onSubmit={submit}>
      <label className="text-sm font-semibold text-bcb-ink">
        Memo title
        <Input className="mt-1.5" name="title" placeholder="Approval for..." required />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-bcb-ink">
          Originating department
          <Input className="mt-1.5" name="originatingDepartment" defaultValue="Finance and Procurement" required />
        </label>
        <label className="text-sm font-semibold text-bcb-ink">
          Document type
          <select className="mt-1.5 h-10 w-full rounded-md border bg-white px-3 text-sm" name="documentType" defaultValue="Board Paper">
            <option>Board Paper</option>
            <option>Memo</option>
            <option>Financial Approval</option>
            <option>Policy</option>
            <option>Supporting Attachment</option>
          </select>
        </label>
      </div>
      <label className="text-sm font-semibold text-bcb-ink">
        Confidentiality
        <select className="mt-1.5 h-10 w-full rounded-md border bg-white px-3 text-sm" name="confidentiality" defaultValue="RESTRICTED">
          <option value="PUBLIC">Public</option>
          <option value="INTERNAL">Internal</option>
          <option value="RESTRICTED">Restricted</option>
          <option value="CONFIDENTIAL">Confidential</option>
          <option value="HIGHLY_CONFIDENTIAL">Highly Confidential</option>
        </select>
      </label>
      <label className="text-sm font-semibold text-bcb-ink">
        Requested decision
        <Textarea className="mt-1.5" name="requestedDecision" placeholder="Board approval requested for..." required />
      </label>
      {message ? <p className="text-sm font-semibold text-bcb-green">{message}</p> : null}
      <Button type="submit" disabled={busy}>
        <FilePlus2 className="h-4 w-4" />
        {busy ? "Creating..." : "Create memo"}
      </Button>
    </form>
  );
}
