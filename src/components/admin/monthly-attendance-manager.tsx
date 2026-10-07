"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CalendarCheck,
  CalendarDays,
  Printer,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Users,
  ChevronRight,
  Info,
} from "@/components/ui/icons";

export type DailyRecord = {
  dayNumber: number;
  date: string;
  dayName: string;
  status: string;
  approvalStatus?: string;
  note: string | null;
};

export type StaffMusterRow = {
  id: string;
  staffCode: string;
  fullName: string;
  department: string;
  designation: string;
  email: string | null;
  mobile: string | null;
  totalDays: number;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  holiday: number;
  attendedDays: number;
  payableDays: number;
  monthlyPercentage: number;
  presenceRate: number;
  dailyList?: DailyRecord[];
};

type MonthlyMusterData = {
  month: string;
  monthLabel: string;
  totalDays: number;
  averageMonthlyRate: number;
  company: {
    name: string;
    legalName: string;
    address: string;
  };
  musterRoll: StaffMusterRow[];
  aggregate: {
    totalPresent: number;
    totalAbsent: number;
    totalHalfDay: number;
    totalLeave: number;
    totalHoliday: number;
    totalAttendedDays: number;
  };
};

export function MonthlyAttendanceManager() {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MonthlyMusterData | null>(null);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [rateFilter, setRateFilter] = useState<"all" | "high" | "average" | "low">("all");

  // Selected staff member for individual detailed list modal
  const [activeStaff, setActiveStaff] = useState<StaffMusterRow | null>(null);
  const [statusTabFilter, setStatusTabFilter] = useState<string>("all");

  // Generate last 12 months options with month names
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setDate(1); // avoid end-of-month rollover
      d.setMonth(d.getMonth() - i);
      const val = d.toISOString().slice(0, 7);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const daysInM = new Date(Date.UTC(y, m, 0)).getUTCDate();
      const label = new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
      }).format(d);
      return { val, label, daysInM };
    });
  }, []);

  async function fetchMonthlyData(monthVal: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/attendance/monthly?month=${monthVal}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load monthly attendance", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMonthlyData(selectedMonth);
  }, [selectedMonth]);

  // Unique departments for filter
  const departments = useMemo(() => {
    if (!data?.musterRoll) return [];
    const depts = new Set<string>();
    data.musterRoll.forEach((s) => {
      if (s.department) depts.add(s.department);
    });
    return Array.from(depts).sort();
  }, [data]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    if (!data?.musterRoll) return [];
    return data.musterRoll.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.fullName.toLowerCase().includes(q) ||
        s.staffCode.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        (s.designation && s.designation.toLowerCase().includes(q));

      const matchesDept = deptFilter === "all" || s.department === deptFilter;

      let matchesRate = true;
      if (rateFilter === "high") matchesRate = s.monthlyPercentage >= 80;
      else if (rateFilter === "average") matchesRate = s.monthlyPercentage >= 60 && s.monthlyPercentage < 80;
      else if (rateFilter === "low") matchesRate = s.monthlyPercentage < 60;

      return matchesSearch && matchesDept && matchesRate;
    });
  }, [data, search, deptFilter, rateFilter]);

  // Keep activeStaff in sync if data reloads
  useEffect(() => {
    if (activeStaff && data) {
      const found = data.musterRoll.find((s) => s.id === activeStaff.id);
      if (found) setActiveStaff(found);
    }
  }, [data]);

  function getRateBadge(pct: number) {
    if (pct >= 80) {
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        bar: "bg-emerald-500",
        label: "Excellent",
      };
    }
    if (pct >= 60) {
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        bar: "bg-amber-500",
        label: "Normal",
      };
    }
    return {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      bar: "bg-rose-500",
      label: "Low",
    };
  }

  // Print individual staff monthly attendance sheet
  function handlePrintIndividual(staff: StaffMusterRow) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const listHtml = (staff.dailyList || [])
      .map((d) => {
        let statusBadge = `<span style="color:#64748b;font-weight:600;">Not Marked</span>`;
        if (d.status === "present") statusBadge = `<span style="color:#059669;font-weight:bold;">PRESENT</span>`;
        else if (d.status === "half_day") statusBadge = `<span style="color:#d97706;font-weight:bold;">HALF DAY (0.5)</span>`;
        else if (d.status === "absent") statusBadge = `<span style="color:#e11d48;font-weight:bold;">ABSENT</span>`;
        else if (d.status === "leave") statusBadge = `<span style="color:#7c3aed;font-weight:bold;">APPROVED LEAVE</span>`;
        else if (d.status === "holiday") statusBadge = `<span style="color:#0284c7;font-weight:bold;">HOLIDAY</span>`;

        return `
          <tr>
            <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;font-family:monospace;">${d.date} (${d.dayName})</td>
            <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;">${statusBadge}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;">${d.note || "—"}</td>
          </tr>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Monthly Attendance Sheet - ${staff.fullName} - ${data?.monthLabel}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #0f172a; margin: 0; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; }
          .meta { font-size: 12px; color: #475569; margin-top: 4px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .kpi { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; background: #f8fafc; }
          .kpi-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
          .kpi-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; font-weight: 700; border-bottom: 2px solid #cbd5e1; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #475569; }
          .sig-box { width: 200px; border-top: 1px solid #0f172a; padding-top: 6px; text-align: center; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${data?.company?.legalName || "AimHop Technologies Pvt Ltd"}</h1>
            <p class="meta">STAFF MONTHLY ATTENDANCE SHEET & BREAKDOWN</p>
            <p class="meta"><strong>Employee:</strong> ${staff.fullName} (${staff.staffCode}) · <strong>Dept:</strong> ${staff.department} · <strong>Designation:</strong> ${staff.designation}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 15px; font-weight: 800; color: #1e3a8a;">${data?.monthLabel}</div>
            <div style="font-size: 12px; font-weight: 600; color: #475569; margin-top: 3px;">Total Days in Month: ${staff.totalDays} Days</div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi">
            <div class="kpi-label">Days Attended (Shift Presence)</div>
            <div class="kpi-val">${staff.attendedDays} / ${staff.totalDays} Days</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Monthly Attendance %</div>
            <div class="kpi-val" style="color: #2563eb;">${staff.monthlyPercentage}%</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Present / Half Days</div>
            <div class="kpi-val">${staff.present} Full · ${staff.halfDay} Half</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Absent / Leaves</div>
            <div class="kpi-val">${staff.absent} Abs · ${staff.leave} Lvs</div>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 8px;">Detailed Day-by-Day Shift Log</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 35%;">Date & Day of Week</th>
              <th style="width: 30%;">Attendance Status</th>
              <th style="width: 35%;">Shift Remarks / Time</th>
            </tr>
          </thead>
          <tbody>
            ${listHtml}
          </tbody>
        </table>

        <div class="footer">
          <div class="sig-box">Employee Signature</div>
          <div class="sig-box">HR / Authorized Signatory</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  }

  // Print all staff muster roll
  function handlePrintCompanyMuster() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = (data?.musterRoll || [])
      .map(
        (s, idx) => `
        <tr>
          <td style="padding:6px;border-bottom:1px solid #cbd5e1;font-size:11px;">${idx + 1}</td>
          <td style="padding:6px;border-bottom:1px solid #cbd5e1;font-size:11px;font-family:monospace;font-weight:bold;">${s.staffCode}</td>
          <td style="padding:6px;border-bottom:1px solid #cbd5e1;font-size:11px;font-weight:700;">${s.fullName}</td>
          <td style="padding:6px;border-bottom:1px solid #cbd5e1;font-size:11px;">${s.department}</td>
          <td style="padding:6px;border-bottom:1px solid #cbd5e1;font-size:11px;text-align:center;">${s.totalDays}</td>
          <td style="padding:6px;border-bottom:1px solid #cbd5e1;font-size:11px;text-align:center;font-weight:bold;color:#059669;">${s.present}</td>
          <td style="padding:6px;border-bottom:1px solid #cbd5e1;font-size:11px;text-align:center;color:#d97706;">${s.halfDay}</td>
          <td style="padding:6px;border-bottom:1px solid #cbd5e1;font-size:11px;text-align:center;color:#e11d48;font-weight:bold;">${s.absent}</td>
          <td style="padding:6px;border-bottom:1px solid #cbd5e1;font-size:11px;text-align:center;color:#7c3aed;">${s.leave}</td>
          <td style="padding:6px;border-bottom:1px solid #cbd5e1;font-size:11px;text-align:center;font-weight:800;background:#f8fafc;">${s.attendedDays}</td>
          <td style="padding:6px;border-bottom:1px solid #cbd5e1;font-size:11px;text-align:center;font-weight:800;color:#2563eb;background:#eff6ff;">${s.monthlyPercentage}%</td>
        </tr>
      `,
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Company Muster Roll - ${data?.monthLabel}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #0f172a; margin: 0; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #0f172a; color: #fff; text-align: left; padding: 6px; font-size: 10px; text-transform: uppercase; font-weight: 700; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #475569; }
          .sig-box { width: 180px; border-top: 1px solid #0f172a; padding-top: 4px; text-align: center; }
          @page { size: landscape; margin: 10mm; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${data?.company?.legalName || "AimHop Technologies"}</h1>
            <div style="font-size:12px;color:#475569;margin-top:2px;">WORKFORCE MONTHLY ATTENDANCE MUSTER ROLL REGISTER</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:14px;font-weight:800;">${data?.monthLabel} (${data?.totalDays} Days)</div>
            <div style="font-size:11px;color:#475569;">Avg Presence: ${data?.averageMonthlyRate}% · Staff: ${data?.musterRoll?.length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:30px;">#</th>
              <th>Code</th>
              <th>Staff Full Name</th>
              <th>Department</th>
              <th style="text-align:center;">Month Days</th>
              <th style="text-align:center;">Present</th>
              <th style="text-align:center;">Half Day</th>
              <th style="text-align:center;">Absent</th>
              <th style="text-align:center;">Leave</th>
              <th style="text-align:center;background:#1e293b;">Attended Days</th>
              <th style="text-align:center;background:#1d4ed8;">Monthly %</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>Generated on: ${new Date().toLocaleDateString("en-IN")}</div>
          <div class="sig-box">HR / Administrative Sign-Off</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  }

  return (
    <div className="space-y-6">
      {/* Top Controls: Month Selector & Explanation Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <CalendarDays size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Monthly Attendance Register & Staff Roster
                </h3>
                {data && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                    {data.totalDays} Days in {data.monthLabel.split(" ")[0]}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly workforce presence rates and attendance muster roll.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Select Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.val} value={opt.val}>
                    {opt.label} ({opt.daysInM} Days)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handlePrintCompanyMuster}
              disabled={loading || !data}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              <Printer size={14} className="text-slate-500" />
              <span>Print Complete Muster Roll</span>
            </button>
          </div>
        </div>

        {/* Informative Formula Callout */}
        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-2.5 text-xs text-slate-600">
          <Info size={16} className="text-blue-600 shrink-0" />
          <span>
            <strong>Calculation Method:</strong> Days Attended (Full Days + 0.5 × Half Days) ÷ Total Days in Month (
            <span className="font-mono font-bold text-blue-700">{data?.totalDays ?? "--"} Days</span>) × 100 ={" "}
            <strong>Monthly Attendance %</strong>.
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Selected Month</span>
            <CalendarCheck size={18} className="text-blue-600" />
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">{data?.monthLabel ?? "--"}</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
            <span>Total Month Days:</span>
            <span className="font-mono font-bold">{data?.totalDays ?? "--"} Days</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Staff Enrolled</span>
            <Users size={18} className="text-indigo-600" />
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">{data?.musterRoll?.length ?? 0} Staff Members</div>
          <div className="mt-1 text-xs text-slate-500">Eligible on monthly roster</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Days Attended</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {data?.aggregate?.totalAttendedDays ?? 0} Days
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {data?.aggregate?.totalPresent ?? 0} Present · {data?.aggregate?.totalHalfDay ?? 0} Half Days
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Workforce Rate</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {data?.averageMonthlyRate ?? 0}%
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {data?.averageMonthlyRate ?? 0}%
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, data?.averageMonthlyRate ?? 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff by name, staff code, or department…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">Dept:</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="all">All Departments ({data?.musterRoll?.length ?? 0})</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Rate:</span>
              <select
                value={rateFilter}
                onChange={(e) => setRateFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="all">All Rates</option>
                <option value="high">High (≥ 80%)</option>
                <option value="average">Normal (60% - 79%)</option>
                <option value="low">Low (&lt; 60%)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table: Staff Monthly Attendance Register */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Staff Monthly Attendance List ({filteredStaff.length} Employees)
              </h4>
              <p className="text-xs text-slate-500">
                Review days attended, absences, approved leaves, and monthly attendance percentages
              </p>
            </div>
            <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-mono font-semibold text-slate-600 shadow-2xs">
              Month Basis: {data?.totalDays ?? "--"} Days
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Clock size={32} className="animate-spin text-blue-600 mb-2" />
            <p className="text-xs font-semibold">Calculating monthly attendance data…</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarCheck size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No staff records match your filter</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the department or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Department / Role</th>
                  <th className="py-3.5 px-3 text-center">Month Days</th>
                  <th className="py-3.5 px-3 text-center">Days Attended</th>
                  <th className="py-3.5 px-3 text-center">Absent</th>
                  <th className="py-3.5 px-3 text-center">Leaves</th>
                  <th className="py-3.5 px-4 text-center">Monthly Attendance %</th>
                  <th className="py-3.5 px-4 text-right">Individual Attendance Sheet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((s) => {
                  const badge = getRateBadge(s.monthlyPercentage);
                  const initials = s.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Staff Member */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700 border border-blue-200 text-xs font-mono">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{s.fullName}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[11px] font-semibold text-slate-500">
                                {s.staffCode}
                              </span>
                              {s.email && (
                                <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                                  {s.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department / Role */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {s.department}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">{s.designation}</div>
                      </td>

                      {/* Total Days in Month */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {s.totalDays} Days
                        </span>
                      </td>

                      {/* Days Attended */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                            {s.attendedDays} Days
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            {s.present} Full · {s.halfDay} Half
                          </span>
                        </div>
                      </td>

                      {/* Absent Days */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                            s.absent > 0 ? "bg-rose-50 text-rose-700 border border-rose-200" : "text-slate-400"
                          }`}
                        >
                          {s.absent} {s.absent === 1 ? "Day" : "Days"}
                        </span>
                      </td>

                      {/* Leaves */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                            s.leave > 0 ? "bg-purple-50 text-purple-700 border border-purple-200" : "text-slate-400"
                          }`}
                        >
                          {s.leave} {s.leave === 1 ? "Day" : "Days"}
                        </span>
                      </td>

                      {/* Monthly Percentage */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black text-slate-900">
                              {s.monthlyPercentage}%
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${badge.bar}`}
                              style={{ width: `${Math.min(100, s.monthlyPercentage)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {s.attendedDays} / {s.totalDays} Days
                          </span>
                        </div>
                      </td>

                      {/* Action: Open Individual Attendance Sheet */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setActiveStaff(s)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition shadow-2xs active:scale-95 cursor-pointer"
                          title="View day-by-day attendance sheet for this employee"
                        >
                          <span>View Attendance Sheet</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INDIVIDUAL STAFF ATTENDANCE MODAL (Detailed Log for selected staff) */}
      {activeStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setActiveStaff(null)}
          />

          <div className="relative z-10 flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/90 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs font-bold font-mono text-sm">
                  {activeStaff.staffCode.slice(-3)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{activeStaff.fullName}</h3>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700">
                      {activeStaff.staffCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeStaff.department} · {activeStaff.designation} · Monthly Roster for{" "}
                    <strong>{data?.monthLabel}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintIndividual(activeStaff)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-500 transition active:scale-95 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Print Employee Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStaff(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/70 hover:text-slate-800 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Stats + Full Day-by-Day Attendance List */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Employee Monthly Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <span className="text-[11px] font-bold uppercase text-slate-500 block">Days Attended</span>
                  <div className="text-xl font-black text-emerald-700 mt-1 font-mono">
                    {activeStaff.attendedDays} Days
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {activeStaff.present} Full · {activeStaff.halfDay} Half
                  </span>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5">
                  <span className="text-[11px] font-bold uppercase text-blue-700 block">Monthly Attendance %</span>
                  <div className="text-xl font-black text-blue-700 mt-1 font-mono">
                    {activeStaff.monthlyPercentage}%
                  </div>
                  <span className="text-[10px] text-blue-600 block mt-0.5">
                    Based on {activeStaff.totalDays} Days in Month
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <span className="text-[11px] font-bold uppercase text-slate-500 block">Absent Days</span>
                  <div className="text-xl font-black text-rose-600 mt-1 font-mono">{activeStaff.absent} Days</div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Unexcused</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <span className="text-[11px] font-bold uppercase text-slate-500 block">Approved Leaves</span>
                  <div className="text-xl font-black text-purple-700 mt-1 font-mono">{activeStaff.leave} Days</div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Paid/Official Leave</span>
                </div>
              </div>

              {/* Day-by-Day Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-100/70 px-4 py-2.5">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Day-by-Day Attendance Records (1st to {activeStaff.totalDays}th {data?.monthLabel})
                  </h5>
                  <div className="flex items-center gap-1">
                    {["all", "present", "absent", "leave"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusTabFilter(status)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition cursor-pointer ${
                          statusTabFilter === status
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {status === "all" ? "All Days" : status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                        <th className="py-2.5 px-4">Date & Day</th>
                        <th className="py-2.5 px-4 text-center">Attendance Status</th>
                        <th className="py-2.5 px-4">Remarks / Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(activeStaff.dailyList || [])
                        .filter((d) => statusTabFilter === "all" || d.status === statusTabFilter)
                        .map((d) => {
                          let badgeEl = (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                              Not Marked / Off
                            </span>
                          );
                          if (d.approvalStatus === "pending") {
                            badgeEl = (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                <Clock size={12} />
                                PENDING APPROVAL ({d.status.toUpperCase()})
                              </span>
                            );
                          } else if (d.approvalStatus === "rejected") {
                            badgeEl = (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                                <XCircle size={12} />
                                REJECTED (ABSENT)
                              </span>
                            );
                          } else if (d.status === "present") {
                            badgeEl = (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                <CheckCircle2 size={12} />
                                PRESENT
                              </span>
                            );
                          } else if (d.status === "half_day") {
                            badgeEl = (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                <Clock size={12} />
                                HALF DAY (0.5)
                              </span>
                            );
                          } else if (d.status === "absent") {
                            badgeEl = (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                                <XCircle size={12} />
                                ABSENT
                              </span>
                            );
                          } else if (d.status === "leave") {
                            badgeEl = (
                              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                                <CalendarDays size={12} />
                                LEAVE
                              </span>
                            );
                          } else if (d.status === "holiday") {
                            badgeEl = (
                              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 border border-sky-200 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                                HOLIDAY
                              </span>
                            );
                          }

                          return (
                            <tr key={d.dayNumber} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2.5 px-4 font-mono font-medium text-slate-700">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 text-center text-slate-400 text-[10px] font-bold">
                                    #{d.dayNumber}
                                  </span>
                                  <span className="font-semibold text-slate-800">{d.date}</span>
                                  <span className="text-slate-400 text-[11px]">({d.dayName})</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-center">{badgeEl}</td>
                              <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                                {d.note ? (
                                  <span className="italic">{d.note}</span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3">
              <span className="text-xs text-slate-500 font-mono">
                Total Days: {activeStaff.totalDays} · Attended: {activeStaff.attendedDays} Days (
                {activeStaff.monthlyPercentage}%)
              </span>
              <button
                type="button"
                onClick={() => setActiveStaff(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
