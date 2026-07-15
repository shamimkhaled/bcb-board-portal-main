"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

/** Brief branded splash on cold start when launched as an installed PWA. */
export function PwaSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isStandalone()) return;
    if (sessionStorage.getItem("bcb-splash-shown") === "1") return;
    sessionStorage.setItem("bcb-splash-shown", "1");
    setShow(true);
    const timer = window.setTimeout(() => setShow(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#006A4E] text-white transition-opacity duration-300"
      aria-hidden="true"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
        <Image src="/bcb-logo.png" alt="" width={64} height={64} className="h-16 w-16 object-contain" />
      </div>
      <p className="mt-4 text-lg font-bold tracking-tight">BCB Portal</p>
      <p className="mt-1 text-xs text-white/75">Directors&apos; Affairs</p>
    </div>
  );
}
