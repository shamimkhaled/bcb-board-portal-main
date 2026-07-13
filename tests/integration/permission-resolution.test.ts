import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hasPermission } from "../../lib/permissions";

test("backend role permissions resolve independently from visibility", async () => {
  const prisma = new PrismaClient();
  try {
    const secretary = await prisma.user.findUniqueOrThrow({ where: { id: "qa-user-secretary" } });
    const director = await prisma.user.findUniqueOrThrow({ where: { id: "qa-user-director" } });
    expect(await hasPermission(secretary, "meeting", "create")).toBe(true);
    expect(await hasPermission(director, "meeting", "create")).toBe(false);
    expect(await hasPermission(director, "agenda", "edit")).toBe(false);
  } finally { await prisma.$disconnect(); }
});
