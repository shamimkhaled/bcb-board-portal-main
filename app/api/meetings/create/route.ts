import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ConfidentialityLevel, MeetingStatus, MeetingType } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await hasPermission(auth.user, "meeting", "create"))) {
    return NextResponse.json({ error: "Meeting create permission required" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const payload = validateMeetingForm(formData);
    const meetingId = `meeting-${randomUUID()}`;
    const meetingCode = `BCB-MTG-${new Date(payload.date).getFullYear()}-${randomUUID().slice(0, 6).toUpperCase()}`;
    const participantIds = unique([payload.chairmanId, payload.secretaryId, ...payload.participantIds]);

    const meeting = await prisma.meeting.create({
      data: {
        id: meetingId,
        meetingCode,
        title: payload.title,
        meetingType: payload.meetingType,
        date: payload.date,
        time: `${payload.startTime}-${payload.endTime}`,
        venueOnlineLink: [payload.venue, payload.onlineLink].filter(Boolean).join(" | "),
        confidentiality: payload.confidentiality,
        status: MeetingStatus.DRAFT,
        timelineJson: JSON.stringify([
          "Draft meeting created",
          `Description: ${payload.description || "Not provided"}`,
          `Acknowledgment deadline: ${payload.acknowledgmentDeadline || "Not set"}`,
          `Attendance deadline: ${payload.attendanceDeadline || "Not set"}`,
          `Quorum: ${payload.quorum || "Not set"}`
        ]),
        attendees: {
          create: participantIds.map((userId) => ({
            id: `meeting-attendee-${randomUUID()}`,
            userId,
            status: userId === payload.chairmanId ? "CHAIR" : userId === payload.secretaryId ? "SECRETARY" : "PENDING"
          }))
        }
      }
    });

    const { ipAddress, browser } = getRequestMeta(request);
    await createAuditLog({
      user: auth.user,
      actionType: "MEETING_CREATED",
      objectType: "Meeting",
      objectId: meeting.id,
      newValue: JSON.stringify({
        meetingCode,
        title: payload.title,
        status: MeetingStatus.DRAFT,
        participantCount: participantIds.length
      }),
      ipAddress,
      browser,
      deviceId: auth.session.deviceId,
      sessionId: auth.session.sessionToken,
      remarks: "Draft meeting created from Meetings > Create Meeting."
    });

    return NextResponse.json({ id: meeting.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create meeting" }, { status: 400 });
  }
}

function validateMeetingForm(formData: FormData) {
  const title = readRequired(formData, "title");
  const meetingType = readEnum(formData, "meetingType", MeetingType);
  const dateText = readRequired(formData, "date");
  const startTime = readRequired(formData, "startTime");
  const endTime = readRequired(formData, "endTime");
  const venue = readRequired(formData, "venue");
  const onlineLink = readOptional(formData, "onlineLink");
  const description = readOptional(formData, "description");
  const confidentiality = readEnum(formData, "confidentiality", ConfidentialityLevel);
  const chairmanId = readRequired(formData, "chairmanId");
  const secretaryId = readRequired(formData, "secretaryId");
  const acknowledgmentDeadline = readOptional(formData, "acknowledgmentDeadline");
  const attendanceDeadline = readOptional(formData, "attendanceDeadline");
  const quorum = readOptional(formData, "quorum");
  const participantIds = formData.getAll("participantIds").map(String).filter(Boolean);
  const date = new Date(`${dateText}T${startTime}:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Select a valid meeting date and start time.");
  if (endTime <= startTime) throw new Error("End time must be after start time.");

  return {
    title,
    meetingType,
    date,
    startTime,
    endTime,
    venue,
    onlineLink,
    description,
    confidentiality,
    chairmanId,
    secretaryId,
    acknowledgmentDeadline,
    attendanceDeadline,
    quorum,
    participantIds
  };
}

function readRequired(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

function readOptional(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readEnum<T extends Record<string, string>>(formData: FormData, key: string, enumValue: T): T[keyof T] {
  const value = readRequired(formData, key);
  if (!Object.values(enumValue).includes(value)) throw new Error(`Invalid ${key}.`);
  return value as T[keyof T];
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
