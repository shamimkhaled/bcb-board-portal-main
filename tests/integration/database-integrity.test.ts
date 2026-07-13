import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

test("submitted meeting remains stored and agenda links have no orphans", async () => {
  const prisma = new PrismaClient();
  try {
    expect(await prisma.meeting.count({ where: { status: "PENDING_CHAIRMAN_REVIEW" } })).toBeGreaterThan(0);
    const orphans = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) as count FROM AgendaDocument ad LEFT JOIN AgendaItem ai ON ai.id=ad.agendaItemId LEFT JOIN Document d ON d.id=ad.documentId WHERE ai.id IS NULL OR d.id IS NULL`;
    expect(Number(orphans[0].count)).toBe(0);
  } finally { await prisma.$disconnect(); }
});
