"use client";

import { useState, useEffect } from "react";
import { Printer, CalendarCheck, Clock, X } from "@/components/ui/icons";

type StaffMusterRow = {
  id: string;
  staffCode: string;
  fullName: string;
  department: string;
  designation: string;
  totalDays: number;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  holiday: number;
  payableDays: number;
  presenceRate: number;
};

type MonthlyMusterData = {
  month: string;
  monthLabel: string;
  totalDays: number;
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
  };
};

export function AdminMusterRollModal() {
  const [open, setOpen] = useState(false);
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MonthlyMusterData | null>(null);

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
      const res = await fetch(`/api/v1/admin/attendance/monthly?month=${monthVal}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load muster roll", e);
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
    const sheetEl = document.querySelector(".printable-muster-roll") as HTMLElement;
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
<title>Monthly Attendance Muster Roll - ${data?.monthLabel}</title>
${sheets.join("\n")}
<style>
  @media print {
    @page { size: A4 landscape; margin: 10mm; }
  }
  html, body {
    margin: 0; padding: 0; background: #ffffff; color: #090d16;
    -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
  }
  body {
    padding: 16px; font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
  }
  .no-print { display: none !important; }
  .printable-muster-roll {
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
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition active:scale-95 cursor-pointer"
      >
        <Printer size={15} />
        <span>Monthly Register / Print Muster Roll</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setOpen(false)}
          />

          <div className="relative z-10 flex flex-col w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Controls Header */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                  <CalendarCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Company Monthly Attendance Muster Roll (All Staff)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprehensive workforce attendance register for HR, Payroll, and Compliance audits
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
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
                  <span>Print Muster Roll (A4 Landscape / PDF)</span>
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

            {/* Modal Body: Scrollable Table Preview */}
            <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100/50">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Clock size={32} className="animate-spin text-blue-600 mb-3" />
                  <p className="text-sm font-semibold">Generating company-wide muster roll…</p>
                </div>
              ) : data ? (
                <div className="printable-muster-roll mx-auto w-full rounded-2xl border border-slate-300/80 bg-white p-6 sm:p-8 shadow-sm text-slate-900">
                  {/* Top Company Header */}
                  <div className="flex items-start justify-between pb-5 border-b-2 border-slate-900">
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
                      <h4 className="text-sm font-black text-blue-700 uppercase tracking-widest mt-1.5">
                        MONTHLY ATTENDANCE REGISTER & MUSTER ROLL
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="inline-block rounded-md border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-900">
                        {data.monthLabel}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1 font-mono font-medium">
                        Total Days: {data.totalDays} Days · Generated for {data.musterRoll.length} Staff
                      </p>
                    </div>
                  </div>

                  {/* Top Aggregate KPI Cards */}
                  <div className="my-5 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Enrolled</p>
                      <p className="text-xl font-black text-slate-900 tabular-nums">{data.musterRoll.length}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Present Days</p>
                      <p className="text-xl font-black text-emerald-700 tabular-nums">{data.aggregate.totalPresent}</p>
                    </div>
                    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Total Absent Days</p>
                      <p className="text-xl font-black text-rose-700 tabular-nums">{data.aggregate.totalAbsent}</p>
                    </div>
                    <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-orange-800">Total Half Days</p>
                      <p className="text-xl font-black text-orange-700 tabular-nums">{data.aggregate.totalHalfDay}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Approved Leaves</p>
                      <p className="text-xl font-black text-amber-700 tabular-nums">{data.aggregate.totalLeave}</p>
                    </div>
                  </div>

                  {/* Muster Roll Table with all requested columns */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                          <th className="py-2.5 px-3">Staff ID</th>
                          <th className="py-2.5 px-3">Employee Name</th>
                          <th className="py-2.5 px-3">Department</th>
                          <th className="py-2.5 px-3 text-center">Total Days</th>
                          <th className="py-2.5 px-3 text-center text-emerald-700">Present (P)</th>
                          <th className="py-2.5 px-3 text-center text-rose-700">Absent (A)</th>
                          <th className="py-2.5 px-3 text-center text-orange-700">Half Day (HD)</th>
                          <th className="py-2.5 px-3 text-center text-amber-700">Leave (L)</th>
                          <th className="py-2.5 px-3 text-center font-bold text-blue-800">Payable Days</th>
                          <th className="py-2.5 px-3 text-right">Attendance %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.musterRoll.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2 px-3 font-mono font-bold text-slate-700">{row.staffCode}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{row.fullName}</td>
                            <td className="py-2 px-3 font-medium text-slate-600">{row.department}</td>
                            <td className="py-2 px-3 text-center font-mono text-slate-700">{row.totalDays}</td>
                            <td className="py-2 px-3 text-center font-bold font-mono text-emerald-700">
                              {row.present}
                            </td>
                            <td className="py-2 px-3 text-center font-bold font-mono text-rose-700">
                              {row.absent}
                            </td>
                            <td className="py-2 px-3 text-center font-bold font-mono text-orange-700">
                              {row.halfDay}
                            </td>
                            <td className="py-2 px-3 text-center font-bold font-mono text-amber-700">
                              {row.leave}
                            </td>
                            <td className="py-2 px-3 text-center font-black font-mono text-blue-700">
                              {row.payableDays}
                            </td>
                            <td className="py-2 px-3 text-right font-black font-mono text-slate-900">
                              {row.presenceRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures Footer */}
                  <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-xs text-slate-600">
                    <div className="space-y-6">
                      <p className="font-semibold text-slate-700">Prepared By (HR Executive)</p>
                      <div className="border-b border-dashed border-slate-400 w-44" />
                      <p className="text-[10px] text-slate-400">Signature & Date</p>
                    </div>
                    <div className="space-y-6 text-center">
                      <p className="font-semibold text-slate-700">Verified By (Operations Manager)</p>
                      <div className="border-b border-dashed border-slate-400 w-44 mx-auto" />
                      <p className="text-[10px] text-slate-400">Signature & Date</p>
                    </div>
                    <div className="space-y-6 text-right">
                      <p className="font-semibold text-slate-700">Approved By (Director / Authorized Signatory)</p>
                      <div className="border-b border-dashed border-slate-400 w-44 ml-auto" />
                      <p className="text-[10px] text-slate-400">Official Seal & Approval</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-slate-500">
                  Unable to load muster roll register.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
