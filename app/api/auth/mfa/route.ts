import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  OTP_CODE,
  PENDING_MFA_COOKIE,
  SESSION_COOKIE,
  authCookieBaseOptions,
  decodePendingMfa,
  getRequestMeta,
  sessionExpiry
} from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  let otp: string | undefined;
  try {
    const body = (await request.json()) as { otp?: string };
    otp = typeof body.otp === "string" ? body.otp.trim() : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid MFA payload." }, { status: 400 });
  }

  const pending = decodePendingMfa(request.cookies.get(PENDING_MFA_COOKIE)?.value);
  const { ipAddress, browser } = getRequestMeta(request);

  if (!pending) {
    return NextResponse.json({ error: "MFA session expired. Please sign in again." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: pending.userId } });
  if (!user) {
    return NextResponse.json({ error: "MFA user not found." }, { status: 400 });
  }

  if (otp !== OTP_CODE) {
    await prisma.loginHistory.create({
      data: {
        id: `login-${randomUUID()}`,
        userId: user.id,
        email: user.email,
        result: "Failed MFA",
        ipAddress,
        deviceId: pending.deviceId,
        browser,
        remarks: "Invalid OTP code"
      }
    });
    await createAuditLog({
      user,
      actionType: "MFA_FAILED",
      objectType: "Authentication",
      objectId: user.id,
      ipAddress,
      browser,
      deviceId: pending.deviceId,
      result: "Warning",
      remarks: "Invalid demo OTP."
    });
    return NextResponse.json({ error: "Invalid OTP. Use 123456 for this demo." }, { status: 401 });
  }

  const token = randomUUID();
  const expiresAt = sessionExpiry();

  await prisma.device.upsert({
    where: { deviceId: pending.deviceId },
    update: {
      userId: user.id,
      label: "Demo login device",
      ipAddress,
      browser,
      lastSeenAt: new Date()
    },
    create: {
      id: `device-${pending.deviceId}`,
      userId: user.id,
      deviceId: pending.deviceId,
      label: "Demo login device",
      status: "TRUSTED",
      ipAddress,
      browser
    }
  });

  await prisma.session.create({
    data: {
      id: `session-${randomUUID()}`,
      sessionToken: token,
      userId: user.id,
      deviceId: pending.deviceId,
      ipAddress,
      browser,
      mfaVerified: true,
      expiresAt
    }
  });

  await prisma.loginHistory.create({
    data: {
      id: `login-${randomUUID()}`,
      userId: user.id,
      email: user.email,
      result: "Success",
      ipAddress,
      deviceId: pending.deviceId,
      browser,
      remarks: "Password and demo MFA accepted"
    }
  });

  await createAuditLog({
    user,
    actionType: "LOGIN_SUCCESS",
    objectType: "Authentication",
    objectId: user.id,
    ipAddress,
    browser,
    deviceId: pending.deviceId,
    sessionId: token,
    result: "Success",
    remarks: "Demo MFA verified and session created."
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(PENDING_MFA_COOKIE, "", {
    ...authCookieBaseOptions(request),
    maxAge: 0
  });
  response.cookies.set(SESSION_COOKIE, token, {
    ...authCookieBaseOptions(request),
    maxAge: 30 * 60
  });

  return response;
}
