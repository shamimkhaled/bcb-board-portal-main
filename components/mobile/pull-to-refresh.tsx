"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pull-to-refresh for native-feeling mobile lists. */
export function PullToRefresh({ children, className }: { children: React.ReactNode; className?: string }) {
  const router = useRouter();
  const startY = useRef(0);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    if (window.scrollY > 0) return;
    startY.current = event.touches[0]?.clientY ?? 0;
  }, []);

  const onTouchMove = useCallback((event: React.TouchEvent) => {
    if (refreshing || window.scrollY > 0 || startY.current === 0) return;
    const delta = (event.touches[0]?.clientY ?? 0) - startY.current;
    if (delta > 0) setPull(Math.min(delta * 0.45, 72));
  }, [refreshing]);

  const onTouchEnd = useCallback(() => {
    if (pull > 56) {
      setRefreshing(true);
      router.refresh();
      window.setTimeout(() => {
        setRefreshing(false);
        setPull(0);
      }, 700);
    } else {
      setPull(0);
    }
    startY.current = 0;
  }, [pull, router]);

  return (
    <div
      className={cn("relative lg:contents", className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="pointer-events-none flex items-center justify-center text-primary transition-[height] duration-150 lg:hidden"
        style={{ height: refreshing ? 40 : pull }}
        aria-hidden={!refreshing && pull < 8}
      >
        {(refreshing || pull > 24) && <LoaderCircle className={cn("h-5 w-5", refreshing && "animate-spin")} />}
      </div>
      {children}
    </div>
  );
}
