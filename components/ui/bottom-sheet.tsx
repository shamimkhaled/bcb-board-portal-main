"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

/** Native-feeling mobile bottom sheet (progressive disclosure). */
export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={title ?? "Menu"}>
      <button type="button" className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" aria-label="Dismiss" onClick={onClose} />
      <div
        className={cn(
          "ds-sheet-enter absolute inset-x-0 bottom-0 max-h-[86vh] overflow-hidden rounded-t-ds-xl border border-slate-200 bg-white shadow-ds-lg",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-slate-200 lg:hidden absolute left-1/2 top-2 -translate-x-1/2" />
          <p className="pt-2 font-display text-sm font-semibold text-bcb-ink">{title}</p>
          <button type="button" className="min-h-11 min-w-11 rounded-ds p-2 text-slate-500 hover:bg-slate-50" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">{children}</div>
      </div>
    </div>
  );
}
