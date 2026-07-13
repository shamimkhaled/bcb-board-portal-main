"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessRequestControls({ requestId }: { requestId: string }) {
  const router = useRouter();

  async function decide(decision: "approve" | "reject") {
    await fetch(`/api/access-requests/${requestId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision })
    });
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="gold" onClick={() => decide("approve")}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        Approve
      </Button>
      <Button size="sm" variant="outline" onClick={() => decide("reject")}>
        <XCircle className="h-3.5 w-3.5" />
        Reject
      </Button>
    </div>
  );
}
