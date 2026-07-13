import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  ConfidentialityLevel,
  DocumentStatus,
  OcrStatus,
  QcStatus,
  RetentionStatus
} from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessDocumentCategory, hasPermission } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await hasPermission(auth.user, "documents", "upload"))) {
    return NextResponse.json({ error: "Document upload permission required" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A PDF, Word, Excel, or image file is required." }, { status: 400 });
  }

  const title = String(formData.get("title") ?? "").trim();
  const documentType = String(formData.get("documentType") ?? "Board Paper");
  const year = Number(formData.get("year") ?? new Date().getFullYear());
  const officialDate = String(formData.get("officialDate") ?? "");
  const confidentiality = String(formData.get("confidentiality") ?? "INTERNAL") as ConfidentialityLevel;
  const departmentOffice = String(formData.get("departmentOffice") ?? "Board Secretariat");
  const keywords = String(formData.get("keywords") ?? "");

  if (!title || !officialDate) {
    return NextResponse.json({ error: "Title and official date are required." }, { status: 400 });
  }
  if (!(await canAccessDocumentCategory(auth.user, documentType, "upload"))) {
    return NextResponse.json({ error: "Document category upload permission required" }, { status: 403 });
  }

  const uploadDir = path.join(process.cwd(), "storage", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  const filePath = path.join(uploadDir, safeFileName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  const count = await prisma.document.count({ where: { year } });
  const documentId = `BCB-DOC-${year}-${String(count + 1).padStart(4, "0")}`;
  const id = `doc-${randomUUID()}`;
  const document = await prisma.document.create({
    data: {
      id,
      documentId,
      title,
      documentType,
      year,
      officialDate: new Date(`${officialDate}T00:00:00+06:00`),
      meetingType: null,
      committeeId: null,
      departmentOffice,
      confidentiality,
      uploadedById: auth.user.id,
      approvedById: null,
      version: "0.1",
      keywords,
      physicalFileReference: `BCB/UPLOAD/${year}/${String(count + 1).padStart(3, "0")}`,
      retentionStatus: RetentionStatus.ACTIVE_RECORD,
      status: DocumentStatus.DRAFT,
      ocrStatus: OcrStatus.PENDING,
      qcStatus: QcStatus.PENDING,
      accessExpiryDate: null,
      fileName: file.name,
      filePath,
      simulatedOcrText: `Simulated OCR placeholder for uploaded file ${file.name}.`,
      isFinalLocked: false
    }
  });

  const { ipAddress, browser } = getRequestMeta(request);
  await createAuditLog({
    user: auth.user,
    actionType: "DOCUMENT_UPLOADED",
    objectType: "Document",
    objectId: document.id,
    documentId: document.documentId,
    ipAddress,
    browser,
    deviceId: auth.session.deviceId,
    sessionId: auth.session.sessionToken,
    result: "Success",
    remarks: "Local file upload stored in workspace storage/uploads."
  });

  return NextResponse.json({ ok: true, documentId: document.documentId });
}
