import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AgendaPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  await requirePermission(auth.user, "agenda", "view");
  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({ where: { id }, include: { agendaItems: { orderBy: { sortOrder: "asc" }, include: { memo: true, documents: true } } } });
  if (!meeting) notFound();
  return <main className="mx-auto max-w-4xl bg-white p-8 text-slate-950 print:max-w-none print:p-0"><div className="border-b-2 border-slate-900 pb-5 text-center"><p className="text-sm font-bold uppercase tracking-widest">Bangladesh Cricket Board</p><h1 className="mt-2 text-3xl font-bold">Meeting Agenda</h1><p className="mt-2">{meeting.meetingCode} · {meeting.title}</p><p>{meeting.date.toLocaleDateString("en-GB")} · {meeting.time} · {meeting.venueOnlineLink}</p></div><ol className="mt-8 space-y-6">{meeting.agendaItems.map((item) => <li key={item.id} className="break-inside-avoid border-b pb-5"><div className="flex justify-between gap-4"><h2 className="text-lg font-bold">{item.itemNumber}. {item.title}</h2><span className="text-sm font-semibold">{item.estimatedDuration} minutes</span></div><p className="mt-2 text-sm">{item.summary}</p><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><p><b>Presenter:</b> {item.presenter}</p><p><b>Decision:</b> {item.decisionType}</p><p><b>Department:</b> {item.responsibleDepartment}</p><p><b>Confidentiality:</b> {item.confidentiality}</p><p><b>Supporting documents:</b> {item.documents.length}</p><p><b>Related memo:</b> {item.memo?.memoId ?? "None"}</p></div></li>)}</ol>{!meeting.agendaItems.length ? <p className="py-12 text-center text-slate-500">No agenda items.</p> : null}</main>;
}
