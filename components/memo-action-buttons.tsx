"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MemoActionButtons({ memoId, canSecretary, canChairman }: { memoId: string; canSecretary: boolean; canChairman: boolean }) {
  const router = useRouter();

  async function act(action: string) {
    await fetch(`/api/memos/${memoId}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => act("submit")}>
        <Send className="h-3.5 w-3.5" />
        Submit
      </Button>
      {canSecretary ? (
        <>
          <Button size="sm" variant="secondary" onClick={() => act("secretary_review")}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Secretary review
          </Button>
          <Button size="sm" variant="outline" onClick={() => act("return")}>
            <RotateCcw className="h-3.5 w-3.5" />
            Return
          </Button>
        </>
      ) : null}
      {canChairman ? (
        <>
          <Button size="sm" variant="gold" onClick={() => act("chairman_approve")}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button size="sm" variant="danger" onClick={() => act("reject")}>
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </Button>
        </>
      ) : null}
    </div>
  );
}
