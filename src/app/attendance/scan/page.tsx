import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDateOnlyUtc } from "@/lib/format";
import { writeAudit } from "@/lib/audit";
import { verifyOfficeSignature } from "@/lib/qr";
import { AlertTriangle } from "@/components/ui/icons";
import { AimHopLogo } from "@/components/ui/aimhop-logo";
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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-8">
        <header className="w-full max-w-md mx-auto flex items-center justify-between pb-4">
          <AimHopLogo size={32} layout="horizontal" useBrandImage={true} />
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-full px-2.5 py-0.5 shadow-2xs">
            Office QR
          </span>
        </header>

        <main className="w-full max-w-md mx-auto my-auto py-4">
          <div className="rounded-2xl border border-rose-200 bg-white p-6 sm:p-7 text-center shadow-sm space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
              <AlertTriangle size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Invalid Office QR Code</h2>
              <p className="text-xs text-rose-600 font-medium leading-relaxed">
                {qrErrorMsg}
              </p>
            </div>
            <Link
              href="/login"
              className="mt-4 block w-full rounded-xl bg-slate-900 py-3 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              AimHop Portal Par Jayein
            </Link>
          </div>
        </main>

        <footer className="w-full max-w-md mx-auto pt-6 text-center text-xs text-slate-400">
          <span>AimHop ERP · Physical Wall QR System</span>
        </footer>
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
          department: staffRecord.department?.name || "General",
          designation: staffRecord.designation,
        };

        const existing = await prisma.attendanceRecord.findUnique({
          where: { staffId_date: { staffId: staffRecord.id, date: todayUtc } },
        });

        const alreadyMarked = Boolean(existing && existing.status === "present");

        if (alreadyMarked) {
          // If already marked, display confirmation immediately
          initialSuccess = {
            alreadyMarked: true,
            message: "Aapki attendance aaj ke din pehle se hi recorded hai.",
            checkinTime: checkinTimeStr,
            staff: sessionStaff,
          };
        }
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header with AimHop Branding */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pb-4">
        <AimHopLogo size={32} layout="horizontal" useBrandImage={true} />
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-full px-2.5 py-0.5 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Wall QR Kiosk
        </span>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md mx-auto my-auto py-2">
        <QuickPunchClient
          companyName={companyName}
          cid={cid}
          sig={sig}
          sessionStaff={sessionStaff}
          initialSuccess={initialSuccess}
          isUnregisteredNotice={isUnregisteredUser}
        />
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto pt-6 text-center text-xs text-slate-400">
        <span>AimHop ERP · Verified Office Attendance</span>
      </footer>
    </div>
  );
}
