import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "connected", version: process.env.npm_package_version ?? "development" });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unavailable", version: process.env.npm_package_version ?? "development" }, { status: 503 });
  }
}
