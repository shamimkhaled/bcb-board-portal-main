"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function DocumentUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/documents/upload", {
      method: "POST",
      body: formData
    });
    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(payload.error || "Upload failed.");
      return;
    }

    formRef.current?.reset();
    setMessage(`Uploaded ${payload.documentId}`);
    router.refresh();
  }

  return (
    <form ref={formRef} className="grid gap-3 rounded-lg border bg-white p-4" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-bcb-ink">
          Title
          <Input className="mt-1.5" name="title" placeholder="Board paper title" required />
        </label>
        <label className="text-sm font-semibold text-bcb-ink">
          Document type
          <select className="mt-1.5 h-10 w-full rounded-md border bg-white px-3 text-sm" name="documentType" defaultValue="Board Paper">
            {[
              "Board Paper",
              "AGM Document",
              "Committee Paper",
              "Meeting Notice",
              "Agenda",
              "Minutes",
              "Resolution",
              "Policy",
              "Correspondence",
              "Memo",
              "Financial Approval",
              "Legal Document",
              "Supporting Attachment",
              "Archive Document"
            ].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-bcb-ink">
          Year
          <Input className="mt-1.5" name="year" type="number" min="2022" max="2026" defaultValue="2026" required />
        </label>
        <label className="text-sm font-semibold text-bcb-ink">
          Official date
          <Input className="mt-1.5" name="officialDate" type="date" defaultValue="2026-06-17" required />
        </label>
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
          Department / Office
          <Input className="mt-1.5" name="departmentOffice" defaultValue="Board Secretariat" required />
        </label>
      </div>
      <label className="text-sm font-semibold text-bcb-ink">
        Keywords
        <Textarea className="mt-1.5 min-h-16" name="keywords" placeholder="agenda, governance, board" />
      </label>
      <label className="text-sm font-semibold text-bcb-ink">
        Upload file
        <Input className="mt-1.5" name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" required />
      </label>
      {message ? <p className="text-sm font-semibold text-bcb-green">{message}</p> : null}
      <Button type="submit" disabled={busy}>
        <UploadCloud className="h-4 w-4" />
        {busy ? "Uploading..." : "Upload and register"}
      </Button>
    </form>
  );
}
