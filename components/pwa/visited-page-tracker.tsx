"use client";

import { openDB } from "idb";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const DB_NAME = "bcb-portal-offline";
const STORE = "visited-routes";

async function recordVisit(pathname: string) {
  if (typeof window === "undefined") return;
  if (!pathname || pathname.startsWith("/api")) return;

  const db = await openDB(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: "pathname" });
      }
    }
  });

  await db.put(STORE, {
    pathname,
    visitedAt: new Date().toISOString()
  });
}

/** Records navigated routes in IndexedDB so the SW can prioritize previously viewed pages. */
export function VisitedPageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    void recordVisit(pathname).catch(() => {
      // Feature-detect / degrade quietly when IndexedDB is unavailable.
    });
  }, [pathname]);

  return null;
}
