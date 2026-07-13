import path from "node:path";

export function assertQaEnvironment(env = process.env) {
  const url = env.DATABASE_URL ?? "";
  const normalized = url.toLowerCase();
  const qaNamed = normalized.includes("test") || normalized.includes("qa");
  if (env.NODE_ENV !== "test") throw new Error("QA refused: NODE_ENV must be test.");
  if (!qaNamed) throw new Error("QA refused: DATABASE_URL must clearly contain test or qa.");
  if (normalized.includes("dev.db") || normalized.includes("prod") || normalized.includes("production")) {
    throw new Error("QA refused: working or production database detected.");
  }
  return { url, sqlitePath: url.startsWith("file:") ? path.resolve("prisma", url.slice(5)) : null };
}
