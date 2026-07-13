import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, getRequestMeta } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const { ipAddress, browser } = getRequestMeta(request);
  const session = token
    ? await prisma.session.findUnique({
        where: { sessionToken: token },
        include: { user: true }
      })
    : null;

  if (session) {
    await prisma.session.delete({ where: { id: session.id } });
    await createAuditLog({
      user: session.user,
      actionType: "LOGOUT",
      objectType: "Authentication",
      objectId: session.userId,
      ipAddress,
      browser,
      deviceId: session.deviceId,
      sessionId: session.sessionToken,
      result: "Success",
      remarks: "User signed out."
    });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
