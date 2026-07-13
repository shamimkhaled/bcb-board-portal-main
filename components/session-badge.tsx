"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SessionBadge({ expiresAt, className }: { expiresAt: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = useMemo(() => {
    if (now === null) return "--:--";
    const milliseconds = Math.max(0, new Date(expiresAt).getTime() - now);
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [expiresAt, now]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        "border border-white/20 bg-white/15 text-white lg:border-emerald-200 lg:bg-emerald-50 lg:text-emerald-800",
        className
      )}
    >
      <Clock3 className="h-3.5 w-3.5" />
      {remaining}
    </div>
  );
}
