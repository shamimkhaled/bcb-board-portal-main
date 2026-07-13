import { History, MessageSquareText } from "lucide-react";
import { MemoStatus } from "@prisma/client";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { MemoActionButtons } from "@/components/memo-action-buttons";
import { MemoCreateForm } from "@/components/memo-create-form";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confidentiality, role } from "@/lib/labels";
import { formatDateTime } from "@/lib/utils";
import { hasPermission, requireModule } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const statusOrder = [
  MemoStatus.DRAFT,
  MemoStatus.SUBMITTED,
  MemoStatus.UNDER_SECRETARY_REVIEW,
  MemoStatus.CHAIRMAN_APPROVAL_PENDING,
  MemoStatus.APPROVED,
  MemoStatus.MARKED_FOR_BOARD_MEETING,
  MemoStatus.ARCHIVED
];

export default async function MemoWorkflowPage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "memo-workflow");
  const [canSecretary, canChairman, canCreate] = await Promise.all([
    hasPermission(auth.user, "memos", "secretaryReview"),
    hasPermission(auth.user, "memos", "chairmanApprove"),
    hasPermission(auth.user, "memos", "create")
  ]);
  const memos = await prisma.memo.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      submittedBy: true,
      relatedCommittee: true,
      relatedMeeting: true,
      histories: { include: { actor: true }, orderBy: { createdAt: "asc" } },
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } }
    }
  });

  return (
    <PageShell
      eyebrow="Memo / Board Paper Workflow"
      title="Memo Workflow"
      description="Departments submit board memos, the Company Secretary reviews and comments, the Chairman approves or rejects, and approved memos can be attached to meeting agendas."
    >
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.6fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Create Department Memo</CardTitle>
            </CardHeader>
            <CardContent>
              {canCreate ? <MemoCreateForm /> : <p className="text-sm leading-6 text-slate-600">Memo creation is not enabled for your current role.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Status Path</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {statusOrder.map((status) => (
                <div key={status} className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2">
                  <span className="text-sm font-medium text-slate-700">{status.replaceAll("_", " ")}</span>
                  <span className="h-2 w-2 rounded-full bg-bcb-green" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {memos.map((memo) => (
            <Card key={memo.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase text-bcb-green">{memo.memoId}</span>
                      <StatusBadge value={memo.status} />
                    </div>
                    <CardTitle className="mt-2">{memo.title}</CardTitle>
                    <p className="mt-2 text-sm text-slate-500">
                      {memo.originatingDepartment} · submitted by {memo.submittedBy.name} ({role(memo.submittedBy.role)})
                    </p>
                  </div>
                  <MemoActionButtons
                    memoId={memo.id}
                    canSecretary={canSecretary}
                    canChairman={canChairman}
                  />
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="rounded-lg border bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Requested decision</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{memo.requestedDecision}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-white p-3">
                      <p className="text-xs text-slate-500">Confidentiality</p>
                      <p className="mt-1 text-sm font-semibold text-bcb-ink">{confidentiality(memo.confidentiality)}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-3">
                      <p className="text-xs text-slate-500">Related meeting</p>
                      <p className="mt-1 text-sm font-semibold text-bcb-ink">{memo.relatedMeeting?.title ?? "Optional"}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-3">
                      <p className="text-xs text-slate-500">Committee</p>
                      <p className="mt-1 text-sm font-semibold text-bcb-ink">{memo.relatedCommittee?.name ?? "None"}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-3">
                      <p className="text-xs text-slate-500">Attachments</p>
                      <p className="mt-1 text-sm font-semibold text-bcb-ink">{memo.supportingAttachments}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-bcb-ink">
                      <History className="h-4 w-4 text-bcb-green" />
                      Approval history
                    </div>
                    <div className="space-y-2">
                      {memo.histories.map((history) => (
                        <div key={history.id} className="rounded-md border bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-bcb-ink">{history.actor.name}</p>
                            <StatusBadge value={history.status} />
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{formatDateTime(history.createdAt)}</p>
                          <p className="mt-2 text-sm text-slate-700">{history.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-bcb-ink">
                      <MessageSquareText className="h-4 w-4 text-bcb-red" />
                      Comments
                    </div>
                    <div className="space-y-2">
                      {memo.comments.map((comment) => (
                        <div key={comment.id} className="rounded-md border bg-amber-50 p-3">
                          <p className="text-sm font-semibold text-amber-950">{comment.author.name}</p>
                          <p className="mt-1 text-sm text-amber-900">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
