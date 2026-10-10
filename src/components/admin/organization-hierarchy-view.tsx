"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Users,
  ChevronDown,
  ChevronRight,
  Search,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import { formatInr } from "@/lib/format";

export type StaffMemberNode = {
  id: string;
  fullName: string;
  staffCode: string;
  designation: string | null;
  photoUrl: string | null;
  email: string | null;
  salaryAmount?: number;
};

export type DepartmentNode = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  status: string;
  headStaff: StaffMemberNode | null;
  staff: StaffMemberNode[];
  totalSalaryCommitment: number;
};

export function OrganizationHierarchyView({
  companyName = "AimHop Technologies",
  legalName = "AimHop Solutions Pvt. Ltd.",
  departments,
}: {
  companyName?: string;
  legalName?: string;
  departments: DepartmentNode[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDeptIds, setExpandedDeptIds] = useState<Set<string>>(
    new Set(departments.map((d) => d.id))
  );

  const toggleDept = (id: string) => {
    setExpandedDeptIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedDeptIds(new Set(departments.map((d) => d.id)));
  const collapseAll = () => setExpandedDeptIds(new Set());

  // Filter departments or members based on search term
  const filteredDepartments = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return departments;

    return departments.filter((d) => {
      const matchDept =
        d.name.toLowerCase().includes(q) ||
        (d.code && d.code.toLowerCase().includes(q)) ||
        (d.headStaff && d.headStaff.fullName.toLowerCase().includes(q));

      const matchMember = d.staff.some(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.staffCode.toLowerCase().includes(q) ||
          (m.designation && m.designation.toLowerCase().includes(q))
      );

      return matchDept || matchMember;
    });
  }, [departments, searchTerm]);

  const totalEmployees = useMemo(
    () => departments.reduce((acc, d) => acc + d.staff.length, 0),
    [departments]
  );

  const totalPayrollBudget = useMemo(
    () => departments.reduce((acc, d) => acc + d.totalSalaryCommitment, 0),
    [departments]
  );

  return (
    <div className="space-y-6">
      {/* Top Controls & Meta Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by department, HOD, role, or staff name…"
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Organogram Visual Canvas */}
      <div className="overflow-x-auto pb-8">
        <div className="min-w-[780px] flex flex-col items-center">
          
          {/* Level 1: Root Executive Enterprise Node */}
          <div className="relative group">
            <div className="w-80 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs text-center transition hover:border-slate-300 hover:shadow-sm">
              <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100/80 shadow-2xs">
                <Building2 size={18} />
              </div>

              <h3 className="text-base font-bold text-slate-900 tracking-tight">{companyName}</h3>
              {legalName && (
                <p className="text-xs text-slate-500 font-normal mt-0.5">{legalName}</p>
              )}

              <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-3 divide-x divide-slate-100 text-center">
                <div className="px-1">
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Units</span>
                  <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{departments.length}</span>
                </div>
                <div className="px-1">
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Workforce</span>
                  <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{totalEmployees}</span>
                </div>
                <div className="px-1">
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Payroll</span>
                  <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{formatInr(totalPayrollBudget)}</span>
                </div>
              </div>
            </div>

            {/* Central Vertical Connector Spine */}
            <div className="w-px h-8 bg-slate-300 mx-auto" />
          </div>

          {/* Level 2: Department Branches Container */}
          <div className="w-full relative">
            {filteredDepartments.length > 1 && (
              <div className="absolute top-0 left-12 right-12 h-px bg-slate-300" />
            )}

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pt-6">
              {filteredDepartments.map((dept) => {
                const isExpanded = expandedDeptIds.has(dept.id);
                const hasMembers = dept.staff.length > 0;

                return (
                  <div key={dept.id} className="flex flex-col items-center relative">
                    {/* Top connecting stub */}
                    <div className="w-px h-6 bg-slate-300 -mt-6 mb-0" />

                    {/* Department Node Card */}
                    <div className="w-full rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-300 flex flex-col justify-between">
                      {/* Department Header */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md border border-blue-200/60 uppercase">
                              {dept.code || "DEPT"}
                            </span>
                            <span
                              className={`h-2 w-2 rounded-full ${
                                dept.status === "active" ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                              title={dept.status}
                            />
                          </div>

                          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            <Users size={12} />
                            {dept.staff.length}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-slate-900 leading-snug">{dept.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {dept.description || "Internal operating division"}
                        </p>
                      </div>

                      {/* Head of Department (HOD) Section */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                          <Crown size={12} className="text-amber-500" />
                          Head of Department (HOD)
                        </span>

                        {dept.headStaff ? (
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                {dept.headStaff.photoUrl ? (
                                  <Image
                                    src={dept.headStaff.photoUrl}
                                    alt={dept.headStaff.fullName}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  dept.headStaff.fullName.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">
                                  {dept.headStaff.fullName}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {dept.headStaff.designation || "Department Lead"}
                                </p>
                              </div>
                            </div>

                            <Link
                              href={`/admin/staff/${dept.headStaff.id}`}
                              className="text-slate-400 hover:text-blue-600 p-1"
                              title="View HOD profile"
                            >
                              <ArrowUpRight size={14} />
                            </Link>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-amber-50/50 border border-dashed border-amber-200 text-center">
                            <p className="text-xs text-amber-700 font-medium">
                              No Head Assigned
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Edit department to assign HOD</p>
                          </div>
                        )}
                      </div>

                      {/* Department Stats Footer & Toggle */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-[10px] text-slate-400 block">Commitment</span>
                          <span className="font-mono font-bold text-slate-800">
                            {formatInr(dept.totalSalaryCommitment)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleDept(dept.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span>{isExpanded ? "Hide Team" : `View Team (${dept.staff.length})`}</span>
                        </button>
                      </div>
                    </div>

                    {/* Level 3: Team Members Nodes (Expandable) */}
                    {isExpanded && (
                      <div className="w-full flex flex-col items-center">
                        <div className="w-px h-4 bg-slate-300" />
                        
                        <div className="w-full rounded-xl bg-slate-50/80 border border-slate-200 p-3 space-y-2">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>Team Members</span>
                            <span>{dept.staff.length} Active</span>
                          </div>

                          {dept.staff.length === 0 ? (
                            <p className="text-xs text-slate-400 py-3 text-center italic">
                              No staff members assigned yet
                            </p>
                          ) : (
                            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                              {dept.staff.map((m) => {
                                const isHod = dept.headStaff?.id === m.id;
                                return (
                                  <Link
                                    key={m.id}
                                    href={`/admin/staff/${m.id}`}
                                    className={`flex items-center justify-between p-2 rounded-lg bg-white border transition-all hover:border-blue-400 hover:shadow-2xs ${
                                      isHod ? "border-amber-200 bg-amber-50/20" : "border-slate-200/70"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="h-6 w-6 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                        {m.fullName.slice(0, 2).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-900 truncate flex items-center gap-1">
                                          <span>{m.fullName}</span>
                                          {isHod && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                              HOD
                                            </span>
                                          )}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-mono truncate">
                                          {m.staffCode} • {m.designation || "Staff"}
                                        </p>
                                      </div>
                                    </div>

                                    <ArrowUpRight size={12} className="text-slate-400 shrink-0" />
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
