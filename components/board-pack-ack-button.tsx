"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BoardPackAckButton({ packId, acknowledged }: { packId: string; acknowledged: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function ack() {
    setBusy(true);
    await fetch(`/api/board-packs/${packId}/acknowledge`, { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return (
    <Button variant={acknowledged ? "outline" : "gold"} onClick={ack} disabled={acknowledged || busy}>
      <CheckCircle2 className="h-4 w-4" />
      {acknowledged ? "Pack acknowledged" : busy ? "Recording..." : "Acknowledge full pack"}
    </Button>
  );
}
