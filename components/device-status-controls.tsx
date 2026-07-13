"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeviceStatusControls({ deviceId }: { deviceId: string }) {
  const router = useRouter();

  async function update(status: string) {
    await fetch(`/api/devices/${deviceId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => update("TRUSTED")}>
        <ShieldCheck className="h-3.5 w-3.5" />
        Trust
      </Button>
      <Button size="sm" variant="danger" onClick={() => update("REVOKED")}>
        <ShieldOff className="h-3.5 w-3.5" />
        Revoke
      </Button>
    </div>
  );
}
