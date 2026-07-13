"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationReadButton({ id, disabled }: { id: string; disabled: boolean }) {
  const router = useRouter();

  async function markRead() {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" onClick={markRead} disabled={disabled}>
      <CheckCircle2 className="h-3.5 w-3.5" />
      {disabled ? "Read" : "Mark read"}
    </Button>
  );
}
