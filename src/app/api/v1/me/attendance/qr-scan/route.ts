import { z } from "zod";
import { isErrorResponse, requireStaffSelf } from "@/lib/rbac";
import { apiOk, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { toDateOnlyUtc } from "@/lib/format";
import { verifyOfficeQrPayload } from "@/lib/qr";

const scanSchema = z.object({
  scannedData: z.string().min(1, "QR payload is required"),
  note: z.string().max(200).optional().nullable(),
});

export async function POST(request: Request) {
  const { getAuthUser } = await import("@/lib/auth");
  const authUser = await getAuthUser();

  if (!authUser) {
    return apiError(
      "UNAUTHORIZED",
      "Aap logged in nahi hain. Kripya pehle AimHop Portal par Login karein taaki aapki attendance lag sake.",
      401
    );
  }

  if (!authUser.staffId) {
    return apiError(
      "STAFF_NOT_REGISTERED",
      "Aapka Staff Record is system mein nahi mila! Kripya apne Office Admin ya HR se contact karke apna Staff Registration karwayein.",
      403
    );
  }

  const user = authUser as typeof authUser & { staffId: string };

  const body = await request.json().catch(() => ({}));
  const parsed = scanSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid QR scan payload", 400);
  }

  const { scannedData, note } = parsed.data;

  // 1. Cryptographically verify the QR code
  const verification = await verifyOfficeQrPayload(scannedData);
  if (!verification.valid) {
    return apiError("INVALID_QR", verification.message || "Invalid or unrecognized Office QR code.", 400);
  }

  const today = toDateOnlyUtc(new Date());

  // 2. Fetch staff info & verify active status
  const staff = await prisma.staff.findUnique({
    where: { id: user.staffId },
    select: { id: true, fullName: true, staffCode: true, status: true, department: { select: { name: true } } },
  });

  if (!staff || staff.status !== "active") {
    return apiError(
      "STAFF_NOT_ACTIVE",
      "Aapka Staff Record active nahi hai. Kripya Admin ya HR se apna staff registration verify karwayein.",
      403
    );
  }

  // 3. Upsert attendance record for today (or retain existing punch-in)
  const existing = await prisma.attendanceRecord.findUnique({
    where: { staffId_date: { staffId: user.staffId, date: today } },
  });

  const checkinTimeStr = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  const checkinNote = note
    ? `${note} (QR Check-In at ${checkinTimeStr})`
    : `Verified via Office QR Scan at ${checkinTimeStr}`;

  const isAlreadyMarked = Boolean(existing && existing.status === "present");
  let displayedTime = checkinTimeStr;

  if (isAlreadyMarked && existing?.note) {
    const timeMatch = existing.note.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm))/);
    if (timeMatch) {
      displayedTime = timeMatch[1];
    }
  }

  let record = existing;

  if (!isAlreadyMarked) {
    record = await prisma.attendanceRecord.upsert({
      where: { staffId_date: { staffId: user.staffId, date: today } },
      update: {
        status: "present",
        approvalStatus: "approved",
        note: checkinNote,
        markedById: user.id,
      },
      create: {
        staffId: user.staffId,
        date: today,
        status: "present",
        approvalStatus: "approved",
        note: checkinNote,
        markedById: user.id,
      },
    });

    // 4. Record in audit trail
    await writeAudit({
      actorUserId: user.id,
      action: "attendance.qr_checkin",
      entityType: "attendance",
      entityId: record.id,
      targetLabel: `${staff.fullName} (${staff.staffCode}) - QR Check-In at ${checkinTimeStr}`,
    });
  }

  return apiOk({
    success: true,
    alreadyMarked: isAlreadyMarked,
    message: isAlreadyMarked
      ? `Aapki attendance aaj pehle se hi recorded hai! (Punch-In: ${displayedTime} IST)`
      : `Attendance verified successfully! Welcome, ${staff.fullName}.`,
    checkinTime: displayedTime,
    record: {
      id: record!.id,
      status: record!.status,
      approvalStatus: record!.approvalStatus,
      date: record!.date.toISOString(),
      note: record!.note,
    },
    staff: {
      fullName: staff.fullName,
      staffCode: staff.staffCode,
      department: staff.department.name,
    },
  });
}
