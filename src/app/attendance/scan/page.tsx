import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDateOnlyUtc } from "@/lib/format";
import { writeAudit } from "@/lib/audit";
import { verifyOfficeSignature } from "@/lib/qr";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  Building2,
  User,
  ArrowRight,
  LogOut,
  LogIn,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function AttendanceScanLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ cid?: string; sig?: string }>;
}) {
  const sp = await searchParams;
  const { cid, sig } = sp;

  // 1. Verify the QR Signature directly using robust cryptographic verification
  const verification = verifyOfficeSignature(cid, sig);
  const isQrValid = verification.valid;
  const qrErrorMsg = verification.message || "Invalid or unverified Office QR token.";

  // 2. Fetch company info
  const company = await prisma.company.findFirst();
  const companyName = company?.name || "AimHop ERP";

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

  let staffRecord = null;
  let attendanceRecord = null;
  let alreadyMarkedToday = false;

  // 4. If QR is valid and User is logged in, look up their Staff profile
  if (isQrValid && authUser && authUser.staffId) {
    staffRecord = await prisma.staff.findUnique({
      where: { id: authUser.staffId },
      include: { department: { select: { name: true } } },
    });

    if (staffRecord && staffRecord.status === "active") {
      const existing = await prisma.attendanceRecord.findUnique({
        where: { staffId_date: { staffId: staffRecord.id, date: todayUtc } },
      });

      if (existing && existing.status === "present") {
        alreadyMarkedToday = true;
        attendanceRecord = existing;
      } else {
        // Record verified attendance for today
        attendanceRecord = await prisma.attendanceRecord.upsert({
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
          entityId: attendanceRecord.id,
          targetLabel: `${staffRecord.fullName} (${staffRecord.staffCode}) - Wall QR Scan at ${checkinTimeStr}`,
        });
      }
    }
  }

  // Construct return login URL
  const loginNextUrl = `/attendance/scan?cid=${encodeURIComponent(cid || "")}&sig=${encodeURIComponent(sig || "")}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-2">
            <Sparkles size={13} />
            <span>AimHop Enterprise Attendance</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">{companyName}</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Physical Wall QR Punch-In System</p>
        </div>

        {/* ============================================================== */}
        {/* SCENARIO 1: Invalid QR Signature */}
        {/* ============================================================== */}
        {!isQrValid && (
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
        )}

        {/* ============================================================== */}
        {/* SCENARIO 2: QR is Valid, BUT User is NOT Logged In */}
        {/* ============================================================== */}
        {isQrValid && !authUser && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 text-center shadow-2xl backdrop-blur-md space-y-5 animate-in fade-in duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <LogIn size={32} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-white">Sign In to Punch Attendance</h2>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Wall QR detect ho gaya hai! Attendance lagane ke liye kripya pehle apna Staff account login karein.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 text-xs text-slate-400 space-y-1.5 text-left">
              <p className="text-slate-200 font-semibold">ℹ️ Niyam (Instructions):</p>
              <p>1. Sign in karte hi aapki attendance automatically record ho jayegi.</p>
              <p>2. Agar aap registered nahi hain, toh login ke baad registration guidance dikhegi.</p>
            </div>

            <Link
              href={`/login?next=${encodeURIComponent(loginNextUrl)}`}
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition active:scale-[0.98]"
            >
              <span>Sign In Karein (Login & Punch)</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCENARIO 3: User Logged In, BUT Staff Profile NOT REGISTERED (Humanable Error) */}
        {/* ============================================================== */}
        {isQrValid && authUser && (!staffRecord || staffRecord.status !== "active") && (
          <div className="rounded-3xl border border-amber-500/40 bg-slate-900/95 p-6 text-center shadow-2xl backdrop-blur-md space-y-5 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <AlertTriangle size={36} />
            </div>

            <div className="space-y-2">
              <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-extrabold uppercase tracking-wider">
                Registration Incomplete / अनरजिस्टर्ड स्टाफ
              </div>
              <h2 className="text-xl font-black text-white">Aapka Staff Record Nahi Mila!</h2>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Aapka user account (<span className="text-amber-300 font-mono">{authUser.email}</span>) logged in hai, lekin system mein aapka <strong>Staff Member Profile registered ya active nahi hai</strong>.
              </p>
            </div>

            {/* Clear, Humanable Action Steps in Hinglish */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left text-xs text-amber-200 space-y-2.5">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <span>👉 Kripya Yeh Karein (Next Steps):</span>
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-200">
                <li>Apne <strong>Office HR / Admin Team</strong> se sampark karein.</li>
                <li>Unhe batayein ki aapka Staff Account create karein aur aapke email se link karein.</li>
                <li>Registration complete hote hi aap jab bhi yeh Wall QR scan karenge, aapki attendance turant lag jayegi.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-slate-800 py-3 text-xs font-bold text-white hover:bg-slate-700 transition"
              >
                <LogOut size={14} />
                <span>Dusre Account Se Login Karein</span>
              </Link>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCENARIO 4: SUCCESS! Staff is Registered & Attendance Recorded */}
        {/* ============================================================== */}
        {isQrValid && authUser && staffRecord && staffRecord.status === "active" && (
          <div className="rounded-3xl border border-emerald-500/40 bg-slate-900/95 p-6 text-center shadow-2xl backdrop-blur-md space-y-5 animate-in zoom-in-95 duration-300">
            {/* Glowing checkmark animation */}
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 shadow-xl shadow-emerald-500/25 animate-bounce">
              <CheckCircle2 size={46} className="stroke-[2.5]" />
              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-xs">
                <Sparkles size={12} />
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-extrabold uppercase tracking-wider">
                {alreadyMarkedToday ? "Already Marked Today" : "Attendance Recorded Successfully"}
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Welcome, {staffRecord.fullName}!
              </h2>
              <p className="text-xs text-emerald-400 font-semibold">
                {alreadyMarkedToday
                  ? "Aapki attendance aaj ke din pehle se hi recorded hai."
                  : "Aapki attendance safaltapoorvak lag chuki hai (Present)."}
              </p>
            </div>

            {/* Attendance Details Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User size={13} className="text-blue-400" /> Employee:
                </span>
                <span className="font-bold text-white">{staffRecord.fullName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Building2 size={13} className="text-blue-400" /> Department:
                </span>
                <span className="font-semibold text-slate-200">{staffRecord.department.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-400" /> Staff ID:
                </span>
                <span className="font-mono font-bold text-blue-400">{staffRecord.staffCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-400" /> Punch-In Time:
                </span>
                <span className="font-mono font-bold text-emerald-300">{checkinTimeStr} IST</span>
              </div>
            </div>

            {/* Success Trigger Button */}
            <Link
              href="/app/attendance"
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-500 transition active:scale-[0.98]"
            >
              <CheckCircle2 size={18} />
              <span>Attendance Verified — Go to Dashboard</span>
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-[11px] text-slate-500 font-mono">
          <span>AimHop ERP · Verified Office Wall QR Kiosk</span>
        </div>
      </div>
    </div>
  );
}
