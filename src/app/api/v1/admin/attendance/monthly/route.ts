import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiOk, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await requirePermission("attendance.read");
  if (isErrorResponse(user)) return user;

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month") || new Date().toISOString().slice(0, 7); // YYYY-MM
  const staffId = searchParams.get("staffId") || undefined;

  const [yearStr, monthStr] = monthParam.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return apiError("INVALID_DATE", "Invalid month format. Expected YYYY-MM.", 400);
  }

  // Calculate month start and end dates in UTC
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();

  // Fetch company info, staff, and records in parallel
  const [company, staffList, records] = await Promise.all([
    prisma.company.findFirst(),
    prisma.staff.findMany({
      where: {
        status: "active",
        ...(staffId ? { id: staffId } : {}),
      },
      orderBy: { fullName: "asc" },
      include: {
        department: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.attendanceRecord.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(staffId ? { staffId } : {}),
      },
      orderBy: { date: "asc" },
    }),
  ]);

  // Group records by staffId
  const recordsByStaff: Record<string, typeof records> = {};
  for (const r of records) {
    if (!recordsByStaff[r.staffId]) {
      recordsByStaff[r.staffId] = [];
    }
    recordsByStaff[r.staffId].push(r);
  }

  // Format month label (e.g. October 2026)
  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(startDate);

  // Compute roster muster roll
  const musterRoll = staffList.map((s) => {
    const staffRecords = recordsByStaff[s.id] || [];
    let present = 0;
    let absent = 0;
    let halfDay = 0;
    let leave = 0;
    let holiday = 0;

    // Daily mapping (day 1..totalDays)
    const dayMap: Record<number, { status: string; note?: string | null }> = {};

    for (const r of staffRecords) {
      const dayNum = new Date(r.date).getUTCDate();
      dayMap[dayNum] = { status: r.status, note: r.note };

      if (r.status === "present") present++;
      else if (r.status === "absent") absent++;
      else if (r.status === "half_day") halfDay++;
      else if (r.status === "leave") leave++;
      else if (r.status === "holiday") holiday++;
    }

    const payableDays = present + halfDay * 0.5 + leave;
    const trackedDays = present + absent + halfDay + leave + holiday;
    const presenceRate = trackedDays > 0 ? Math.round(((present + halfDay * 0.5) / trackedDays) * 100) : 0;

    return {
      id: s.id,
      staffCode: s.staffCode,
      fullName: s.fullName,
      department: s.department.name,
      designation: s.designation || s.category.name,
      email: s.email,
      mobile: s.mobile,
      totalDays,
      present,
      absent,
      halfDay,
      leave,
      holiday,
      payableDays,
      presenceRate,
      dayMap,
    };
  });

  // Aggregate totals
  const aggregate = musterRoll.reduce(
    (acc, m) => {
      acc.totalPresent += m.present;
      acc.totalAbsent += m.absent;
      acc.totalHalfDay += m.halfDay;
      acc.totalLeave += m.leave;
      acc.totalHoliday += m.holiday;
      return acc;
    },
    { totalPresent: 0, totalAbsent: 0, totalHalfDay: 0, totalLeave: 0, totalHoliday: 0 },
  );

  return apiOk({
    month: monthParam,
    monthLabel,
    totalDays,
    company: {
      name: company?.name || "AimHop CRM",
      legalName: company?.legalName || company?.name || "AimHop Technologies Pvt Ltd",
      address: company?.address || "Corporate Headquarters, India",
    },
    musterRoll,
    aggregate,
  });
}
