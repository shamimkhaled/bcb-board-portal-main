"use client";

import { Download, Share, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

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

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    if (isIos()) {
      setShowIos(true);
      setVisible(true);
      return;
    }

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 rounded-[1.5rem] border border-white/15 bg-[#05382c] p-4 text-white shadow-ds-float lg:bottom-6 lg:left-auto lg:right-6 lg:w-[360px]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Install BCB Portal</p>
          {showIos ? (
            <p className="mt-1 text-xs leading-5 text-emerald-100/80">
              Tap <Share className="mx-0.5 inline h-3.5 w-3.5" /> Share, then <strong>Add to Home Screen</strong>.
            </p>
          ) : (
            <p className="mt-1 text-xs leading-5 text-emerald-100/80">Add to your home screen for a full-screen app experience.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {!showIos ? (
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
