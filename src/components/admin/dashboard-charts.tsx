"use client";

import { useState } from "react";
import { formatInr } from "@/lib/format";
import { TrendingUp, Calendar, CreditCard } from "lucide-react";

export type DayAttendanceStat = {
  date: string;
  label: string;
  present: number;
  absent: number;
  leave: number;
  halfDay: number;
  total: number;
  rate: number;
};

export function AttendanceTrendChart({
  data = [],
}: {
  data: DayAttendanceStat[];
}) {
  const [hoveredDay, setHoveredDay] = useState<DayAttendanceStat | null>(null);

  const averageRate =
    data.length > 0
      ? Math.round(data.reduce((acc, d) => acc + d.rate, 0) / data.length)
      : 0;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Calendar size={15} />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                7-Day Attendance Trend
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Daily presence rate and workforce activity
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60 font-mono">
              <TrendingUp size={13} />
              {averageRate}% 7d avg
            </span>
          </div>
        </div>

        {/* Hover detail tooltip card */}
        <div className="h-9 mb-2 flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
          {hoveredDay ? (
            <>
              <span className="font-bold text-slate-800">{hoveredDay.label}</span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-emerald-700 font-bold">
                  {hoveredDay.present} Present ({hoveredDay.rate}%)
                </span>
                <span className="text-rose-600 font-medium">{hoveredDay.absent} Absent</span>
                <span className="text-amber-600 font-medium">{hoveredDay.leave} Leave</span>
              </div>
            </>
          ) : (
            <span className="text-slate-400 text-xs italic">
              Hover over any day bar below to inspect detailed attendance breakdown
            </span>
          )}
        </div>

        {/* Interactive Bar Columns */}
        <div className="pt-4 flex items-end justify-between gap-2 h-44">
          {data.map((d) => {
            const isHovered = hoveredDay?.date === d.date;
            // Height proportional to rate (min 8%, max 100%)
            const barHeight = Math.max(8, d.rate);

            return (
              <div
                key={d.date}
                onMouseEnter={() => setHoveredDay(d)}
                onMouseLeave={() => setHoveredDay(null)}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
              >
                {/* Rate label above bar */}
                <span
                  className={`text-[10px] font-mono font-bold transition-all ${
                    isHovered
                      ? "text-emerald-700 scale-110"
                      : "text-slate-400 group-hover:text-slate-700"
                  }`}
                >
                  {d.rate}%
                </span>

                {/* Vertical Bar */}
                <div className="w-full max-w-[42px] bg-slate-100 rounded-xl h-full flex flex-col justify-end p-1 transition-all group-hover:bg-slate-200/60">
                  <div
                    style={{ height: `${barHeight}%` }}
                    className={`w-full rounded-lg transition-all duration-300 relative ${
                      d.rate >= 80
                        ? "bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-xs shadow-emerald-500/20"
                        : d.rate >= 60
                        ? "bg-gradient-to-t from-blue-600 to-blue-400 shadow-xs shadow-blue-500/20"
                        : "bg-gradient-to-t from-amber-600 to-amber-400 shadow-xs shadow-amber-500/20"
                    } ${isHovered ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
                  />
                </div>

                {/* Day label */}
                <span
                  className={`text-[11px] font-semibold transition-colors truncate max-w-full ${
                    isHovered ? "text-blue-600 font-bold" : "text-slate-500"
                  }`}
                >
                  {d.label.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            &gt;80% Strong
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            60-80% Normal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            &lt;60% Low
          </span>
        </div>
        <span>Calculated from active employee check-ins</span>
      </div>
    </div>
  );
}

export function PayrollDisbursementGauge({
  committed = 0,
  paid = 0,
  pending = 0,
  periodLabel = "This Month",
}: {
  committed: number;
  paid: number;
  pending: number;
  periodLabel?: string;
}) {
  const percentage =
    committed > 0 ? Math.min(100, Math.round((paid / committed) * 100)) : 0;

  // SVG circular gauge math
  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <CreditCard size={15} />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Payroll Cycle Status
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            {periodLabel}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
          {/* Circular Ring Gauge */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg width={size} height={size} className="rotate-[-90deg]">
              {/* Background Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-slate-100"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Animated Progress Ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-blue-600 transition-all duration-1000 ease-out"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Inner Percentage Value */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {percentage}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Disbursed
              </span>
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Total Commitment
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {formatInr(committed)}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500 font-mono">100%</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                  Paid Recorded
                </span>
                <span className="text-sm font-bold text-emerald-800 font-mono">
                  {formatInr(paid)}
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-700 font-mono">{percentage}%</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block">
                  Outstanding Balance
                </span>
                <span className="text-sm font-bold text-amber-800 font-mono">
                  {formatInr(pending)}
                </span>
              </div>
              <span className="text-xs font-bold text-amber-700 font-mono">
                {100 - percentage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Verified from approved disbursement vouchers</span>
        <span className="font-semibold text-blue-700 font-mono">Real-time ledger</span>
      </div>
    </div>
  );
}
