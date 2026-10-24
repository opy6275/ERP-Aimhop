import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDateOnlyUtc } from "@/lib/format";
import { writeAudit } from "@/lib/audit";
import { verifyOfficeSignature } from "@/lib/qr";
import { AlertTriangle } from "@/components/ui/icons";
import { QuickPunchClient } from "@/components/attendance/quick-punch-client";

export const dynamic = "force-dynamic";

export default async function AttendanceScanLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ cid?: string; sig?: string }>;
}) {
  const sp = await searchParams;
  const { cid, sig } = sp;

  // 1. Verify the QR Signature directly using cryptographic HMAC check
  const verification = verifyOfficeSignature(cid, sig);
  const isQrValid = verification.valid;
  const qrErrorMsg = verification.message || "Invalid or unverified Office QR token.";

  // 2. Fetch company info
  const company = await prisma.company.findFirst();
  const companyName = company?.name || "AimHop ERP";

  // If QR code signature is physically invalid or tampered
  if (!isQrValid) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-rose-900/40 bg-slate-900/90 p-6 text-center shadow-2xl backdrop-blur-md space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle size={36} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-extrabold text-white">Invalid Office QR Code</h2>
              <p className="text-xs text-rose-300 font-medium leading-relaxed">
                {qrErrorMsg}
              </p>
            </div>
            <Link
              href="/login"
              className="mt-4 block w-full rounded-2xl bg-slate-800 py-3 text-xs font-bold text-white hover:bg-slate-700 transition"
            >
              AimHop Portal Par Jayein
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Check Authentication & Staff Record
  const authUser = await getAuthUser();
  const todayUtc = toDateOnlyUtc(new Date());

  const checkinTimeStr = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  let initialSuccess = null;
  let isUnregisteredUser = false;
  let sessionStaff = null;

  // 4. If user is logged in, check if they are registered active staff
  if (authUser) {
    if (authUser.staffId) {
      const staffRecord = await prisma.staff.findUnique({
        where: { id: authUser.staffId },
        include: { department: { select: { name: true } } },
      });

      if (staffRecord && staffRecord.status === "active") {
        sessionStaff = {
          id: staffRecord.id,
          fullName: staffRecord.fullName,
          staffCode: staffRecord.staffCode,
          department: staffRecord.department.name,
          designation: staffRecord.designation,
        };

        const existing = await prisma.attendanceRecord.findUnique({
          where: { staffId_date: { staffId: staffRecord.id, date: todayUtc } },
        });

        const alreadyMarked = Boolean(existing && existing.status === "present");

        if (!alreadyMarked) {
          const record = await prisma.attendanceRecord.upsert({
            where: { staffId_date: { staffId: staffRecord.id, date: todayUtc } },
            update: {
              status: "present",
              approvalStatus: "approved",
              note: `Verified Wall QR Scan at ${checkinTimeStr}`,
              markedById: authUser.id,
            },
            create: {
              staffId: staffRecord.id,
              date: todayUtc,
              status: "present",
              approvalStatus: "approved",
              note: `Verified Wall QR Scan at ${checkinTimeStr}`,
              markedById: authUser.id,
            },
          });

          await writeAudit({
            actorUserId: authUser.id,
            action: "attendance.qr_wall_checkin",
            entityType: "attendance",
            entityId: record.id,
            targetLabel: `${staffRecord.fullName} (${staffRecord.staffCode}) - Wall QR Scan at ${checkinTimeStr}`,
          });
        }

        // Direct Access Success data for immediate display
        initialSuccess = {
          alreadyMarked,
          message: alreadyMarked
            ? "Aapki attendance aaj ke din pehle se hi recorded hai."
            : "Aapki attendance safaltapoorvak lag chuki hai (Present).",
          checkinTime: checkinTimeStr,
          staff: sessionStaff,
        };
      } else {
        // User logged in but staff profile inactive or not found
        isUnregisteredUser = true;
      }
    } else {
      // User logged in without a staffId
      isUnregisteredUser = true;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <QuickPunchClient
        companyName={companyName}
        cid={cid}
        sig={sig}
        sessionStaff={sessionStaff}
        initialSuccess={initialSuccess}
        isUnregisteredNotice={isUnregisteredUser}
      />
    </div>
  );
}
