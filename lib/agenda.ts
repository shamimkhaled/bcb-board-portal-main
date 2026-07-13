import { AgendaDecisionType, ConfidentialityLevel, MeetingStatus } from "@prisma/client";

export const editableMeetingStatuses = new Set<MeetingStatus>([
  MeetingStatus.DRAFT,
  MeetingStatus.AGENDA_PREPARATION,
  MeetingStatus.RETURNED_FOR_CORRECTION
]);

export function assertEditableMeeting(status: MeetingStatus) {
  if (!editableMeetingStatuses.has(status)) throw new Error("This agenda is read-only in the meeting's current status.");
}

export function parseAgendaPayload(input: Record<string, unknown>) {
  const title = required(input.title, "Title");
  const summary = required(input.summary, "Summary");
  const presenter = required(input.presenter, "Presenter");
  const responsibleDepartment = required(input.responsibleDepartment, "Responsible department");
  const estimatedDuration = Number(input.estimatedDuration);
  if (!Number.isInteger(estimatedDuration) || estimatedDuration < 1 || estimatedDuration > 1440) {
    throw new Error("Estimated duration must be between 1 and 1440 minutes.");
  }
  const decisionType = enumValue(input.decisionType, AgendaDecisionType, "decision type");
  const confidentiality = enumValue(input.confidentiality, ConfidentialityLevel, "confidentiality");
  const memoId = optional(input.memoId);
  const secretaryNotes = optional(input.secretaryNotes);
  const documentIds = Array.isArray(input.documentIds) ? [...new Set(input.documentIds.map(String).filter(Boolean))] : [];
  return { title, summary, presenter, responsibleDepartment, estimatedDuration, decisionType, confidentiality, memoId, secretaryNotes, documentIds };
}

function required(value: unknown, label: string) {
  const result = String(value ?? "").trim();
  if (!result) throw new Error(`${label} is required.`);
  if (result.length > 2000) throw new Error(`${label} is too long.`);
  return result;
}

function optional(value: unknown) {
  return String(value ?? "").trim() || null;
}

function enumValue<T extends Record<string, string>>(value: unknown, values: T, label: string): T[keyof T] {
  const result = String(value ?? "");
  if (!Object.values(values).includes(result)) throw new Error(`Invalid ${label}.`);
  return result as T[keyof T];
}
