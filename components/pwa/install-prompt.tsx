"use client";

import { Download, Share, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Survive App Router remounts so preventDefault is not lost without a prompt path. */
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let installListenerBound = false;

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

const DISMISS_KEY = "bcb-pwa-install-dismissed";

function isDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function bindInstallListener() {
  if (typeof window === "undefined" || installListenerBound) return;
  installListenerBound = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    // Only hijack the browser banner when we will show our own Install CTA.
    if (isStandalone() || isDismissed()) return;
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("bcb-pwa-install-available"));
  });
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(deferredInstallPrompt);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (isDismissed()) return;

    bindInstallListener();

    if (isIos()) {
      setShowIos(true);
      setVisible(true);
      return;
    }

    if (deferredInstallPrompt) {
      setDeferred(deferredInstallPrompt);
      setVisible(true);
    }

    function onAvailable() {
      setDeferred(deferredInstallPrompt);
      setVisible(Boolean(deferredInstallPrompt));
    }

    window.addEventListener("bcb-pwa-install-available", onAvailable);
    return () => window.removeEventListener("bcb-pwa-install-available", onAvailable);
  }, []);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    deferredInstallPrompt = null;
    setDeferred(null);
    setVisible(false);
  }, []);

  async function install() {
    const event = deferred ?? deferredInstallPrompt;
    if (!event) return;
    try {
      await event.prompt();
      await event.userChoice;
    } finally {
      deferredInstallPrompt = null;
      setDeferred(null);
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install BCB Portal"
      className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 rounded-[1.5rem] border border-white/15 bg-[#05382c] p-4 text-white shadow-ds-float lg:bottom-6 lg:left-auto lg:right-6 lg:w-[360px]"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <Download className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Install BCB Portal</p>
          {showIos ? (
            <p className="mt-1 text-xs leading-5 text-emerald-100/80">
              Tap <Share className="mx-0.5 inline h-3.5 w-3.5" aria-hidden /> Share, then <strong>Add to Home Screen</strong>.
            </p>
          ) : (
            <p className="mt-1 text-xs leading-5 text-emerald-100/80">
              Add to your home screen for a full-screen app experience.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {!showIos && deferred ? (
              <Button size="sm" className="min-h-11 rounded-2xl bg-white text-[#05382c] hover:bg-white/90" onClick={install}>
                Install
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              className="min-h-11 rounded-2xl border-white/25 bg-transparent text-white hover:bg-white/10"
              onClick={dismiss}
            >
              Not now
            </Button>
          </div>
        </div>
        <button type="button" className="rounded-xl p-2 text-white/70 hover:bg-white/10" aria-label="Dismiss" onClick={dismiss}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
