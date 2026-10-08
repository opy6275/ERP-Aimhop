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

  // Fetch company info, staff, records, and company holidays in parallel
  const [company, staffList, records, holidays] = await Promise.all([
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
    prisma.companyHoliday.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  const holidayByDay: Record<number, string> = {};
  for (const h of holidays) {
    const dayNum = new Date(h.date).getUTCDate();
    holidayByDay[dayNum] = h.name;
  }

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
    const dayMap: Record<number, { status: string; approvalStatus?: string; note?: string | null }> = {};

    for (const r of staffRecords) {
      const dayNum = new Date(r.date).getUTCDate();
      dayMap[dayNum] = { status: r.status, approvalStatus: r.approvalStatus, note: r.note };

      if (r.approvalStatus === "approved" || !r.approvalStatus) {
        if (r.status === "present") present++;
        else if (r.status === "absent") absent++;
        else if (r.status === "half_day") halfDay++;
        else if (r.status === "leave") leave++;
        else if (r.status === "holiday") holiday++;
      }
    }

    // Check official company holidays for this month
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      if (holidayByDay[dayNum] && !dayMap[dayNum]) {
        dayMap[dayNum] = {
          status: "holiday",
          approvalStatus: "approved",
          note: holidayByDay[dayNum],
        };
        holiday++;
      }
    }

    const attendedDays = present + halfDay * 0.5;
    const payableDays = attendedDays + leave + holiday;
    const trackedDays = present + absent + halfDay + leave + holiday;
    // Monthly attendance percentage strictly based on total days of this month (e.g. 28/29 for Feb, 30 for April, 31 for Oct)
    const monthlyPercentage = totalDays > 0 ? Math.round((attendedDays / totalDays) * 1000) / 10 : 0;
    const trackedPresenceRate = trackedDays > 0 ? Math.round((attendedDays / trackedDays) * 1000) / 10 : 0;

    // Full day-by-day attendance list for this employee (Day 1 to totalDays)
    const dailyList = Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const dateObj = new Date(Date.UTC(year, month - 1, dayNum));
      const dateStr = dateObj.toISOString().slice(0, 10);
      const rec = dayMap[dayNum];
      const dayName = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(dateObj);
      return {
        dayNumber: dayNum,
        date: dateStr,
        dayName,
        status: rec?.status || "not_marked",
        approvalStatus: rec?.approvalStatus || (rec ? "approved" : "not_marked"),
        note: rec?.note || null,
      };
    });

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
      attendedDays,
      payableDays,
      trackedDays,
      monthlyPercentage,
      presenceRate: monthlyPercentage,
      trackedPresenceRate,
      dayMap,
      dailyList,
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
      acc.totalAttendedDays += m.attendedDays;
      return acc;
    },
    { totalPresent: 0, totalAbsent: 0, totalHalfDay: 0, totalLeave: 0, totalHoliday: 0, totalAttendedDays: 0 },
  );

  const averageMonthlyRate =
    musterRoll.length > 0
      ? Math.round((musterRoll.reduce((acc, m) => acc + m.monthlyPercentage, 0) / musterRoll.length) * 10) / 10
      : 0;

  return apiOk({
    month: monthParam,
    monthLabel,
    totalDays,
    averageMonthlyRate,
    company: {
      name: company?.name || "AimHop ERP",
      legalName: company?.legalName || company?.name || "AimHop Technologies Pvt Ltd",
      address: company?.address || "Corporate Headquarters, India",
    },
    musterRoll,
    aggregate,
  });
}
