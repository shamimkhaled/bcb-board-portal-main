import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Always reuse one PrismaClient across Next.js route modules.
 * Creating many clients attaches repeated "close" listeners and triggers
 * MaxListenersExceededWarning under `next start`.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

globalForPrisma.prisma = prisma;
