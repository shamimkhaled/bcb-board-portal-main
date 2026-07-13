"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RequestAccessButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function requestAccess() {
    setBusy(true);
    const response = await fetch("/api/access-requests/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId,
        reason: "Demo request for restricted board document review.",
        requestedAccessDuration: "7 days"
      })
    });
    setBusy(false);
    setMessage(response.ok ? "Access request submitted." : "Could not submit request.");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={requestAccess} disabled={busy}>
        <UserCheck className="h-4 w-4" />
        {busy ? "Submitting..." : "Request restricted access"}
      </Button>
      {message ? <p className="text-xs font-semibold text-bcb-green">{message}</p> : null}
    </div>
  );
}
