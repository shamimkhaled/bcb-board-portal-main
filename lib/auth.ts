import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Device, Session, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "bcb_session";
export const PENDING_MFA_COOKIE = "bcb_pending_mfa";
export const OTP_CODE = "123456";
export const SESSION_MINUTES = 30;

export type AuthUser = User;

export type AuthContext = {
  user: AuthUser;
  session: Session;
  device: Device | null;
};

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export function getRequestMeta(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || "127.0.0.1";
  const browser = request.headers.get("user-agent") || "Unknown browser";
  return { ipAddress, browser };
}

export async function getServerMeta() {
  const headerStore = await headers();
  return {
    ipAddress: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1",
    browser: headerStore.get("user-agent") || "Unknown browser"
  };
}

export function encodePendingMfa(payload: { userId: string; deviceId: string; issuedAt: string }) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signCookieBody(body)}`;
}

export function decodePendingMfa(value: string | undefined) {
  if (!value) return null;
  try {
    const [body, signature] = value.split(".");
    if (!body || !signature || !isValidSignature(body, signature)) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      userId: string;
      deviceId: string;
      issuedAt: string;
    };
  } catch {
    return null;
  }
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is required in production.");
  }
  return "bcb-paperless-local-development-secret";
}

function signCookieBody(body: string) {
  return createHmac("sha256", getAuthSecret()).update(body).digest("base64url");
}

function isValidSignature(body: string, signature: string) {
  const expected = signCookieBody(body);
  const expectedBytes = Buffer.from(expected);
  const signatureBytes = Buffer.from(signature);
  return expectedBytes.length === signatureBytes.length && timingSafeEqual(expectedBytes, signatureBytes);
}

export function newDeviceId() {
  return `BCB-DEMO-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function sessionExpiry() {
  return new Date(Date.now() + SESSION_MINUTES * 60 * 1000);
}

export async function getCurrentAuth(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true }
  });

  if (!session || !session.mfaVerified || session.expiresAt <= new Date()) {
    return null;
  }

  const device = await prisma.device.findUnique({
    where: { deviceId: session.deviceId }
  });

  return {
    user: session.user,
    session,
    device
  };
}

export async function requireAuth() {
  const auth = await getCurrentAuth();
  if (!auth) redirect("/login");
  return auth;
}

export function canUseSecretaryControls(role: string) {
  return ["SYSTEM_ADMIN", "COMPANY_SECRETARY", "BOARD_CHAIRMAN"].includes(role);
}

export function canAdminister(role: string) {
  return role === "SYSTEM_ADMIN";
}

export function canApproveAsChairman(role: string) {
  return role === "BOARD_CHAIRMAN" || role === "SYSTEM_ADMIN";
}
