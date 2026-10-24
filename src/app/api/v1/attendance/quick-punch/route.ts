import { z } from "zod";
import { apiOk, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { toDateOnlyUtc } from "@/lib/format";
import { verifyOfficeSignature } from "@/lib/qr";

const quickPunchSchema = z.object({
  identifier: z.string().min(1, "Staff Code, Mobile, ya Email enter karein"),
  cid: z.string().optional().nullable(),
  sig: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = quickPunchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Kripya apna Staff Code ya Mobile enter karein.", 400);
  }

  const { identifier, cid, sig } = parsed.data;

  // Optional: If cid/sig provided, verify it
  if (cid && sig) {
    const verification = verifyOfficeSignature(cid, sig);
    if (!verification.valid) {
      return apiError("INVALID_QR", "Office QR code invalid ya expired hai.", 400);
    }
  }

  const cleanId = identifier.trim();
  const cleanUpper = cleanId.toUpperCase();
  const cleanLower = cleanId.toLowerCase();

  // 1. Staff Code variations (e.g. staff-6 -> STAFF-00006, 00006 -> STAFF-00006)
  const codeVariations = [cleanId, cleanUpper, cleanLower];
  const digitsOnly = cleanId.replace(/\D/g, "");
  if (digitsOnly.length > 0 && digitsOnly.length <= 5) {
    codeVariations.push(`STAFF-${digitsOnly.padStart(5, "0")}`);
  }

  // 2. Mobile variations (e.g. 10 digits, +91, 0 prefix)
  const phoneVariations = [cleanId];
  if (digitsOnly.length === 10) {
    phoneVariations.push(digitsOnly, `+91${digitsOnly}`, `+91 ${digitsOnly}`, `0${digitsOnly}`);
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    const tenDigits = digitsOnly.slice(2);
    phoneVariations.push(tenDigits, `+${digitsOnly}`, `+91${tenDigits}`, `+91 ${tenDigits}`);
  }

  // 3. Look up staff by staffCode, mobile, email, linked user email, or ID
  const staff = await prisma.staff.findFirst({
    where: {
      OR: [
        { staffCode: { in: codeVariations } },
        { mobile: { in: phoneVariations } },
        { email: cleanId },
        { email: cleanLower },
        { id: cleanId },
        { user: { email: cleanId } },
        { user: { email: cleanLower } },
      ],
    },
    include: {
      department: { select: { name: true } },
      user: { select: { id: true, email: true } },
    },
  });

  // If staff not found or not active -> Return exact requested message
  if (!staff || staff.status !== "active") {
    return apiError(
      "STAFF_NOT_REGISTERED",
      "Aap registered staff nahi hain. Kripya pehle register kariye.",
      404
    );
  }

  // Auto-heal: If user email exists and differs from staff email, sync them permanently
  if (staff.user?.email && staff.user.email.toLowerCase() !== staff.email?.toLowerCase()) {
    await prisma.staff.update({
      where: { id: staff.id },
      data: { email: staff.user.email },
    }).catch(() => null);
  }

  const today = toDateOnlyUtc(new Date());

  const checkinTimeStr = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  const existing = await prisma.attendanceRecord.findUnique({
    where: { staffId_date: { staffId: staff.id, date: today } },
  });

  const alreadyMarked = Boolean(existing && existing.status === "present");

  let recordedCheckinTime = checkinTimeStr;
  if (existing?.note) {
    const match = /at\s+([0-9:apm\s]+IST|[0-9:apm\s]+)/i.exec(existing.note);
    if (match && match[1]) {
      recordedCheckinTime = match[1].trim();
    }
  }

  // If NOT already marked today, record verified attendance
  let record = existing;
  if (!alreadyMarked) {
    record = await prisma.attendanceRecord.upsert({
      where: { staffId_date: { staffId: staff.id, date: today } },
      update: {
        status: "present",
        approvalStatus: "approved",
        note: `Wall QR Punch-In at ${checkinTimeStr}`,
        markedById: staff.user?.id || null,
      },
      create: {
        staffId: staff.id,
        date: today,
        status: "present",
        approvalStatus: "approved",
        note: `Wall QR Punch-In at ${checkinTimeStr}`,
        markedById: staff.user?.id || null,
      },
    });

    await writeAudit({
      actorUserId: staff.user?.id || null,
      action: "attendance.quick_punch",
      entityType: "attendance",
      entityId: record.id,
      targetLabel: `${staff.fullName} (${staff.staffCode}) - QR Punch-In at ${checkinTimeStr}`,
    });
  }

  return apiOk({
    success: true,
    alreadyMarked,
    message: alreadyMarked
      ? `Aapki attendance aaj pehle se hi recorded hai!`
      : `Attendance lag chuki hai (Present)! Welcome, ${staff.fullName}.`,
    checkinTime: recordedCheckinTime,
    staff: {
      id: staff.id,
      fullName: staff.fullName,
      staffCode: staff.staffCode,
      department: staff.department?.name || "General",
      designation: staff.designation,
    },
  });
}
