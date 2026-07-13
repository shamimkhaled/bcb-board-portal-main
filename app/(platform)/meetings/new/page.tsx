import { notFound } from "next/navigation";
import { ConfidentialityLevel, MeetingType } from "@prisma/client";
import { MeetingCreateForm } from "@/components/meeting-create-form";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { requireAuth } from "@/lib/auth";
import { hasPermission, requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewMeetingPage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "meetings");
  if (!(await hasPermission(auth.user, "meeting", "create"))) notFound();

  const users = await prisma.user.findMany({
    where: { status: "Active" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true }
  });

  return (
    <PageShell
      eyebrow="Meeting Management"
      title="Create Meeting"
      description="Create a draft meeting with chairman, secretary, participant, deadline, quorum, and confidentiality details."
    >
      <Card>
        <CardContent className="p-5">
          <MeetingCreateForm
            users={users.map((user) => ({ ...user, role: user.role }))}
            meetingTypes={Object.values(MeetingType)}
            confidentialityLevels={Object.values(ConfidentialityLevel)}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
