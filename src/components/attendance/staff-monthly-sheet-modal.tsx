"use client";

import { useState, useEffect } from "react";
import { Printer, CalendarCheck, Clock, X, CheckCircle2, AlertCircle } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";

type MonthlyAttendanceData = {
  month: string;
  monthLabel: string;
  totalDays: number;
  company: {
    name: string;
    legalName: string;
    address: string;
  };
  staff: {
    fullName: string;
    staffCode: string;
    department: string;
    designation: string;
    email: string | null;
    mobile: string | null;
  } | null;
  summary: {
    totalDays: number;
    present: number;
    absent: number;
    half_day: number;
    leave: number;
    holiday: number;
    payableDays: number;
    presenceRate: number;
  };
  records: Array<{
    id: string;
    date: string;
    status: string;
    note?: string | null;
  }>;
};

export function StaffMonthlySheetModal({
  initialStaff,
}: {
  initialStaff?: { id?: string; fullName?: string; staffCode?: string };
}) {
  const [open, setOpen] = useState(false);
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MonthlyAttendanceData | null>(null);

  // Month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = d.toISOString().slice(0, 7);
    const label = new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(d);
    return { val, label };
  });

  async function fetchData(monthVal: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/me/attendance?month=${monthVal}`);
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
    if (open) {
      fetchData(selectedMonth);
    }
  }, [open, selectedMonth]);

  function handlePrint() {
    const sheetEl = document.querySelector(".printable-attendance-sheet") as HTMLElement;
    if (!sheetEl) return;

    const frame = document.createElement("iframe");
    frame.style.cssText =
      "position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(frame);

    const frameDoc = frame.contentDocument || frame.contentWindow?.document;
    if (!frameDoc) {
      document.body.removeChild(frame);
      return;
    }

    const sheets: string[] = [];
    document.querySelectorAll('link[rel="stylesheet"]').forEach((el) => sheets.push(el.outerHTML));
    document.querySelectorAll("style").forEach((el) => sheets.push(el.outerHTML));

    frameDoc.open();
    frameDoc.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Monthly Attendance - ${data?.staff?.fullName || "Employee"} - ${data?.monthLabel}</title>
${sheets.join("\n")}
<style>
  @media print {
    @page { size: A4 portrait; margin: 12mm; }
  }
  html, body {
    margin: 0; padding: 0; background: #ffffff; color: #090d16;
    -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
  }
  body {
    padding: 16px; font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
  }
  .no-print { display: none !important; }
  .printable-attendance-sheet {
    width: 100% !important; max-width: 100% !important; height: auto !important;
    border: none !important; box-shadow: none !important;
  }
</style>
</head>
<body>
${sheetEl.outerHTML}
</body>
</html>`);
    frameDoc.close();

    setTimeout(() => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch (err) {
        console.error("Print error", err);
      } finally {
        setTimeout(() => {
          document.body.removeChild(frame);
        }, 1500);
      }
    }, 400);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-500 transition active:scale-95 cursor-pointer"
      >
        <Printer size={15} />
        <span>Download / Print Monthly Sheet</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setOpen(false)}
          />

          <div className="relative z-10 flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Controls Header (Not in print) */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
                  <CalendarCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Official Monthly Attendance Timesheet</h3>
                  <p className="text-xs text-slate-500">Print or save as PDF for company records & personal filing</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Month Picker */}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer shadow-2xs"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.val} value={opt.val}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={loading || !data}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Printer size={14} />
                  <span>Print / Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/70 hover:text-slate-800 transition cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Sheet Preview */}
            <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100/50">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Clock size={32} className="animate-spin text-blue-600 mb-3" />
                  <p className="text-sm font-semibold">Generating official attendance register…</p>
                </div>
              ) : data ? (
                <div className="printable-attendance-sheet mx-auto max-w-3xl rounded-2xl border border-slate-300/80 bg-white p-6 sm:p-8 shadow-sm text-slate-900">
                  {/* Top Company Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black tracking-tight text-slate-900">
                          {data.company.legalName}
                        </span>
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                          ERP
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{data.company.address}</p>
                      <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mt-1">
                        Workforce Shift & Attendance Certification
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-slate-800">
                        {data.monthLabel}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        PERIOD: {data.month}-01 to {data.month}-{data.totalDays}
                      </p>
                    </div>
                  </div>

                  {/* Employee Identity Box */}
                  <div className="my-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Name</span>
                      <p className="text-sm font-extrabold text-slate-900">{data.staff?.fullName || "Employee"}</p>
                      <p className="text-slate-500 font-mono mt-0.5">ID: {data.staff?.staffCode || "STAFF-00000"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department & Role</span>
                      <p className="text-sm font-bold text-slate-900">{data.staff?.department || "General"}</p>
                      <p className="text-slate-500 mt-0.5">{data.staff?.designation || "Staff"}</p>
                    </div>
                  </div>

                  {/* Monthly Summary Statistics Grid — As Requested by User */}
                  <div className="mb-6 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Days</p>
                      <p className="text-xl font-black text-slate-900 tabular-nums mt-0.5">{data.totalDays}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Present</p>
                      <p className="text-xl font-black text-emerald-700 tabular-nums mt-0.5">{data.summary.present}</p>
                    </div>
                    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Absent</p>
                      <p className="text-xl font-black text-rose-700 tabular-nums mt-0.5">{data.summary.absent}</p>
                    </div>
                    <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-orange-800">Half Day</p>
                      <p className="text-xl font-black text-orange-700 tabular-nums mt-0.5">{data.summary.half_day}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Leave</p>
                      <p className="text-xl font-black text-amber-700 tabular-nums mt-0.5">{data.summary.leave}</p>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Payable Days</p>
                      <p className="text-xl font-black text-blue-700 tabular-nums mt-0.5">{data.summary.payableDays}</p>
                    </div>
                  </div>

                  {/* Day-by-day Detailed Attendance Roster Table */}
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                          <th className="py-2 px-3 w-16">Date</th>
                          <th className="py-2 px-3 w-28">Shift Day</th>
                          <th className="py-2 px-3 w-28">Status</th>
                          <th className="py-2 px-3">Location & Check-In Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.records.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-slate-400">
                              No shift check-ins recorded for this month.
                            </td>
                          </tr>
                        ) : (
                          data.records.map((r, idx) => {
                            const dateObj = new Date(r.date);
                            const dayName = new Intl.DateTimeFormat("en-IN", {
                              weekday: "short",
                              timeZone: "Asia/Kolkata",
                            }).format(dateObj);

                            const statusColors: Record<string, string> = {
                              present: "text-emerald-700 bg-emerald-50 border-emerald-200",
                              absent: "text-rose-700 bg-rose-50 border-rose-200",
                              half_day: "text-orange-700 bg-orange-50 border-orange-200",
                              leave: "text-amber-700 bg-amber-50 border-amber-200",
                              holiday: "text-sky-700 bg-sky-50 border-sky-200",
                            };

                            return (
                              <tr key={r.id || idx} className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 font-mono font-bold text-slate-800">
                                  {formatDate(r.date)}
                                </td>
                                <td className="py-1.5 px-3 font-medium text-slate-600">{dayName}</td>
                                <td className="py-1.5 px-3">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                                      statusColors[r.status] || "text-slate-700 bg-slate-100"
                                    }`}
                                  >
                                    {r.status.replace("_", " ")}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 text-slate-500 font-medium">{r.note || "—"}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures & Certification Footer */}
                  <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
                    <div className="space-y-6">
                      <p className="font-semibold text-slate-700">Employee Signature</p>
                      <div className="border-b border-dashed border-slate-400 w-44" />
                      <p className="text-[10px] text-slate-400">Date: ____ / ____ / ________</p>
                    </div>
                    <div className="space-y-6 text-right sm:text-left">
                      <p className="font-semibold text-slate-700">Authorized HR & Accounts Signatory</p>
                      <div className="border-b border-dashed border-slate-400 w-44 ml-auto sm:ml-0" />
                      <p className="text-[10px] text-slate-400">Official Seal & Verification</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-slate-500">
                  Unable to load attendance sheet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
