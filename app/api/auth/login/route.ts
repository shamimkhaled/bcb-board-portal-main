import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { PENDING_MFA_COOKIE, encodePendingMfa, getRequestMeta, hashPassword, newDeviceId } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as {
    email?: string;
    password?: string;
  };
  const { ipAddress, browser } = getRequestMeta(request);
  const normalizedEmail = email?.trim().toLowerCase() ?? "";

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user || user.passwordHash !== hashPassword(password ?? "")) {
    await prisma.loginHistory.create({
      data: {
        id: `login-${randomUUID()}`,
        userId: user?.id ?? null,
        email: normalizedEmail || "unknown",
        result: "Failed",
        ipAddress,
        deviceId: null,
        browser,
        remarks: "Invalid email or password"
      }
    });
    await createAuditLog({
      user,
      actionType: "LOGIN_FAILED",
      objectType: "Authentication",
      objectId: normalizedEmail,
      ipAddress,
      browser,
      result: "Warning",
      remarks: "Failed credentials login attempt."
    });

    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const deviceId = newDeviceId();
  const response = NextResponse.json({ mfaRequired: true });
  response.cookies.set(
    PENDING_MFA_COOKIE,
    encodePendingMfa({
      userId: user.id,
      deviceId,
      issuedAt: new Date().toISOString()
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
      path: "/"
    }
  );

  await createAuditLog({
    user,
    actionType: "PASSWORD_ACCEPTED",
    objectType: "Authentication",
    objectId: user.id,
    ipAddress,
    browser,
    deviceId,
    result: "Success",
    remarks: "Credentials accepted; MFA challenge issued."
  });

  return response;
}
