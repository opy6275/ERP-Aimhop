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

  // Look up staff by staffCode, mobile, email, or ID
  const staff = await prisma.staff.findFirst({
    where: {
      OR: [
        { staffCode: { equals: cleanId, mode: "insensitive" } },
        { mobile: { equals: cleanId } },
        { email: { equals: cleanId, mode: "insensitive" } },
        { id: cleanId },
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

  const record = await prisma.attendanceRecord.upsert({
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

  return apiOk({
    success: true,
    alreadyMarked,
    message: alreadyMarked
      ? `Aapki attendance aaj ke liye pehle se recorded hai.`
      : `Attendance lag chuki hai (Present)! Welcome, ${staff.fullName}.`,
    checkinTime: checkinTimeStr,
    staff: {
      id: staff.id,
      fullName: staff.fullName,
      staffCode: staff.staffCode,
      department: staff.department.name,
      designation: staff.designation,
    },
  });
}
