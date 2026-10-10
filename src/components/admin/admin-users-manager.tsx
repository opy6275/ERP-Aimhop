"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Search,
  Lock,
  Building2,
  AlertCircle,
  Pencil,
  Trash2,
  Check,
  Sparkles,
  Key,
  UserCheck,
} from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { DataTable, Td } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import { inputClass, labelClass } from "@/lib/form-styles";
import { formatDate, formatDateTime } from "@/lib/format";

export type RoleOption = {
  id: string;
  name: string;
  slug: string;
};

export type UserAccessItem = {
  id: string;
  isMasterAdmin: boolean;
  staffId: string | null;
  staffCode: string | null;
  fullName: string;
  departmentName: string;
  designation: string | null;
  contactEmail: string | null;
  mobile: string | null;
  hasUser: boolean;
  userId: string | null;
  loginEmail: string | null;
  roleName: string;
  roleSlug: string;
  userIsActive: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
};

type Metrics = {
  totalMembers: number;
  activeLogins: number;
  pendingLogins: number;
  adminUsers: number;
};

type FilterTab = "all" | "has-login" | "pending-login" | "admin" | "active" | "inactive";

export function AdminUsersManager({
  items,
  roles,
  metrics,
  currentUserId,
}: {
  items: UserAccessItem[];
  roles: RoleOption[];
  metrics: Metrics;
  currentUserId: string;
}) {
  const router = useRouter();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Modals & Dialogs
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [toggleStatusDialogOpen, setToggleStatusDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

  // Target item for actions
  const [selectedItem, setSelectedItem] = useState<UserAccessItem | null>(null);

  // Async state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states inside Credentials Modal (Grant / Edit Login)
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formConfirmPassword, setFormConfirmPassword] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.departmentName) set.add(i.departmentName);
    });
    return Array.from(set).sort();
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    let result = items;

    if (filterTab === "has-login") {
      result = result.filter((i) => i.hasUser);
    } else if (filterTab === "pending-login") {
      result = result.filter((i) => !i.hasUser);
    } else if (filterTab === "admin") {
      result = result.filter(
        (i) => i.isMasterAdmin || i.roleSlug === "admin" || i.roleSlug === "super_admin",
      );
    } else if (filterTab === "active") {
      result = result.filter((i) => i.hasUser && i.userIsActive);
    } else if (filterTab === "inactive") {
      result = result.filter((i) => i.hasUser && !i.userIsActive);
    }

    if (departmentFilter !== "all") {
      result = result.filter((i) => i.departmentName === departmentFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (i) =>
          i.fullName.toLowerCase().includes(q) ||
          (i.staffCode && i.staffCode.toLowerCase().includes(q)) ||
          (i.loginEmail && i.loginEmail.toLowerCase().includes(q)) ||
          (i.contactEmail && i.contactEmail.toLowerCase().includes(q)) ||
          i.departmentName.toLowerCase().includes(q) ||
          (i.designation && i.designation.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [items, filterTab, departmentFilter, searchTerm]);

  // Open Grant Login Modal (for staff without user account)
  function handleOpenGrantLogin(item: UserAccessItem) {
    setError(null);
    setSuccess(null);
    setSelectedItem(item);
    setFormEmail(item.contactEmail || "");
    setFormPassword("");
    setFormConfirmPassword("");
    setFormIsActive(true);
    setCredentialsModalOpen(true);
  }

  // Open Manage/Edit Login Modal (for staff or admin with user account)
  function handleOpenManageLogin(item: UserAccessItem) {
    setError(null);
    setSuccess(null);
    setSelectedItem(item);
    setFormEmail(item.loginEmail || item.contactEmail || "");
    setFormPassword("");
    setFormConfirmPassword("");
    setFormIsActive(item.userIsActive);
    setCredentialsModalOpen(true);
  }

  // Save Credentials (Grant new or update existing)
  async function handleSaveCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!formEmail.trim()) {
      setError("Email address is required.");
      setLoading(false);
      return;
    }

    // If creating new login, password is required
    if (!selectedItem.hasUser) {
      if (!formPassword || formPassword.length < 6) {
        setError("Password must be at least 6 characters long.");
        setLoading(false);
        return;
      }
      if (formPassword !== formConfirmPassword) {
        setError("Passwords do not match. Please re-enter to confirm.");
        setLoading(false);
        return;
      }
    } else {
      // If editing existing, password is optional
      if (formPassword.trim()) {
        if (formPassword.length < 6) {
          setError("New password must be at least 6 characters long.");
          setLoading(false);
          return;
        }
        if (formPassword !== formConfirmPassword) {
          setError("New passwords do not match. Please re-enter to confirm.");
          setLoading(false);
          return;
        }
      }
    }

    try {
      if (selectedItem.staffId) {
        // Staff member credentials API
        const payload: { email: string; password?: string; isActive: boolean } = {
          email: formEmail.trim().toLowerCase(),
          isActive: formIsActive,
        };
        if (formPassword.trim()) {
          payload.password = formPassword;
        }

        const res = await fetch(`/api/v1/admin/staff/${selectedItem.staffId}/credentials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || data.error || "Failed to save credentials.");
          return;
        }

        setSuccess(
          selectedItem.hasUser
            ? "Credentials updated successfully!"
            : "Portal login account created! The staff member can now log in.",
        );
        setTimeout(() => {
          setCredentialsModalOpen(false);
          router.refresh();
        }, 800);
      } else if (selectedItem.userId) {
        // Standalone admin credentials API
        const payload: { email: string; password?: string; isActive: boolean } = {
          email: formEmail.trim().toLowerCase(),
          isActive: formIsActive,
        };
        if (formPassword.trim()) {
          payload.password = formPassword;
        }

        const res = await fetch(`/api/v1/admin/users/${selectedItem.userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || data.error || "Failed to update administrator credentials.");
          return;
        }

        setSuccess("Administrator account updated successfully!");
        setTimeout(() => {
          setCredentialsModalOpen(false);
          router.refresh();
        }, 800);
      }
    } catch {
      setError("Network communication error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Toggle Portal Status (Active vs Inactive)
  async function confirmToggleStatus() {
    if (!selectedItem) return;
    setLoading(true);

    try {
      if (selectedItem.staffId) {
        const res = await fetch(`/api/v1/admin/staff/${selectedItem.staffId}/credentials`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !selectedItem.userIsActive }),
        });
        if (res.ok) {
          setToggleStatusDialogOpen(false);
          router.refresh();
        }
      } else if (selectedItem.userId) {
        const res = await fetch(`/api/v1/admin/users/${selectedItem.userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !selectedItem.userIsActive }),
        });
        if (res.ok) {
          setToggleStatusDialogOpen(false);
          router.refresh();
        }
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }

  // Revoke Portal Login Access
  async function confirmRevokeAccess() {
    if (!selectedItem) return;
    setLoading(true);

    try {
      if (selectedItem.staffId) {
        const res = await fetch(`/api/v1/admin/staff/${selectedItem.staffId}/credentials`, {
          method: "DELETE",
        });
        if (res.ok) {
          setRevokeDialogOpen(false);
          router.refresh();
        }
      } else if (selectedItem.userId) {
        const res = await fetch(`/api/v1/admin/users/${selectedItem.userId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setRevokeDialogOpen(false);
          router.refresh();
        }
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="User Management & Staff Access"
          description="Manage system access, employee credentials, and portal authentication."
          breadcrumbs={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "User Management" },
          ]}
        />
      </div>

      {/* Summary KPI Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Personnel"
          value={metrics.totalMembers}
          hint="Total workforce records"
          icon={<Users size={18} />}
        />
        <KpiCard
          label="Portal Login Enabled"
          value={metrics.activeLogins}
          hint="Active portal accounts"
          tone="success"
          icon={<ShieldCheck size={18} />}
        />
        <KpiCard
          label="Login Pending / No Access"
          value={metrics.pendingLogins}
          hint="Pending credential assignment"
          tone={metrics.pendingLogins > 0 ? "warning" : "default"}
          icon={<Key size={18} />}
        />
        <KpiCard
          label="Administrators"
          value={metrics.adminUsers}
          hint="Administrative accounts"
          tone="primary"
          icon={<Lock size={18} />}
        />
      </div>

      {/* Filter Toolbar & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterTab === "all"
                ? "bg-white text-blue-700 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Personnel ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("has-login")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterTab === "has-login"
                ? "bg-white text-blue-700 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Login Enabled ({metrics.activeLogins})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("pending-login")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterTab === "pending-login"
                ? "bg-white text-amber-700 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending Login ({metrics.pendingLogins})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("admin")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterTab === "admin"
                ? "bg-white text-purple-700 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Administrators ({metrics.adminUsers})
          </button>
        </div>

        {/* Search & Department Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search staff, code, email, role…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg shadow-2xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Personnel & Access Control Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <DataTable
          headers={[
            "Staff Member / Name",
            "Department & Role",
            "Login Credentials",
            "Portal Access",
            "Last Login",
            "Actions",
          ]}
        >
          {filteredItems.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-12 text-center text-xs text-slate-500">
                {searchTerm.trim() || filterTab !== "all" || departmentFilter !== "all"
                  ? "No personnel match the filter criteria."
                  : "No personnel records found in the database."}
              </td>
            </tr>
          ) : (
            filteredItems.map((item) => {
              const isSelf = item.userId === currentUserId;
              const initials = item.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/70 transition-colors border-b border-slate-100 last:border-0"
                >
                  {/* Staff Member / Name Column */}
                  <Td>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold border ${
                          item.isMasterAdmin
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : item.roleSlug === "admin"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : item.hasUser
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          {item.staffId ? (
                            <Link
                              href={`/admin/staff/${item.staffId}`}
                              className="font-semibold text-slate-900 text-xs sm:text-sm hover:text-blue-600 transition"
                            >
                              {item.fullName}
                            </Link>
                          ) : (
                            <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                              {item.fullName}
                            </span>
                          )}

                          {item.staffCode && (
                            <span className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                              {item.staffCode}
                            </span>
                          )}

                          {isSelf && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                          {item.designation || (item.isMasterAdmin ? "Root Administrator" : "Staff Member")}
                          {item.mobile && ` • ${item.mobile}`}
                        </span>
                      </div>
                    </div>
                  </Td>

                  {/* Department & Role Column */}
                  <Td>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
                        <Building2 size={13} className="text-slate-400 shrink-0" />
                        <span>{item.departmentName}</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          item.isMasterAdmin
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : item.roleSlug === "admin"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : item.hasUser
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {item.roleName}
                      </span>
                    </div>
                  </Td>

                  {/* Login Credentials Column */}
                  <Td>
                    {item.hasUser ? (
                      <div>
                        <span className="font-mono text-xs text-slate-900 font-medium block">
                          {item.loginEmail}
                        </span>
                        <span className="text-[10px] text-emerald-600 block">
                          Credentials Configured
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle size={11} className="text-amber-600" />
                          No Login Account
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Cannot access staff portal yet
                        </span>
                      </div>
                    )}
                  </Td>

                  {/* Portal Access Status Column */}
                  <Td>
                    {item.hasUser ? (
                      <div className="flex items-center gap-2.5">
                        <Switch
                          checked={item.userIsActive}
                          disabled={isSelf || loading}
                          onCheckedChange={() => {
                            if (isSelf) return;
                            setSelectedItem(item);
                            setToggleStatusDialogOpen(true);
                          }}
                          size="sm"
                        />
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            item.userIsActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {item.userIsActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Access Disabled
                      </span>
                    )}
                  </Td>

                  {/* Last Login Column */}
                  <Td>
                    {item.lastLoginAt ? (
                      <span className="font-medium text-xs text-slate-800 block">
                        {formatDateTime(item.lastLoginAt)}
                      </span>
                    ) : item.hasUser ? (
                      <span className="text-xs text-slate-400 italic">
                        Never logged in
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </Td>

                  {/* Actions Column */}
                  <Td>
                    {item.hasUser ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenManageLogin(item)}
                          className="h-7 px-2 text-xs text-slate-700 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50"
                          title="Manage Login / Reset Password"
                        >
                          <Pencil size={12} className="text-slate-500" />
                          <span>Password</span>
                        </Button>

                        {!isSelf && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={loading}
                            onClick={() => {
                              setSelectedItem(item);
                              setRevokeDialogOpen(true);
                            }}
                            className="h-7 px-2 text-xs text-rose-600 border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700"
                            title="Revoke login access"
                          >
                            <Trash2 size={12} className="text-rose-500" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleOpenGrantLogin(item)}
                        className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-2xs font-semibold gap-1.5 cursor-pointer"
                      >
                        <Key size={12} />
                        <span>+ Grant Login</span>
                      </Button>
                    )}
                  </Td>
                </tr>
              );
            })
          )}
        </DataTable>
      </div>

      {/* ========================================================================= */}
      {/* GRANT / EDIT CREDENTIALS MODAL */}
      {/* ========================================================================= */}
      <Modal
        open={credentialsModalOpen}
        onClose={() => setCredentialsModalOpen(false)}
        title={selectedItem?.hasUser ? "Manage Login Credentials" : "Grant Portal Login Access"}
        description={
          selectedItem
            ? `${selectedItem.fullName} • ${selectedItem.staffCode || "Administrator"} (${selectedItem.departmentName})`
            : "Configure login credentials."
        }
        size="default"
      >
        <form onSubmit={handleSaveCredentials} className="space-y-4">
          {/* Section 1: Email */}
          <div>
            <label className={labelClass}>Login Email Address *</label>
            <input
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="name@company.com"
              className={inputClass}
            />
          </div>

          {/* Section 2: Password Inputs (Clean Manual Input with Eye Toggle) */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {selectedItem?.hasUser ? "Update Password (Optional)" : "Set Manual Password *"}
            </h4>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  {selectedItem?.hasUser ? "New Password" : "Password *"}
                </label>
                <PasswordInput
                  value={formPassword}
                  onChange={setFormPassword}
                  placeholder={selectedItem?.hasUser ? "Leave blank to keep current" : "Min. 6 characters"}
                  required={!selectedItem?.hasUser}
                  minLength={selectedItem?.hasUser ? undefined : 6}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {selectedItem?.hasUser ? "Confirm New Password" : "Confirm Password *"}
                </label>
                <PasswordInput
                  value={formConfirmPassword}
                  onChange={setFormConfirmPassword}
                  placeholder="Re-enter password"
                  required={!selectedItem?.hasUser && Boolean(formPassword)}
                  minLength={selectedItem?.hasUser ? undefined : 6}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Enter a secure password for this user (minimum 6 characters). Passwords are securely hashed with bcrypt.
            </p>
          </div>

          {/* Section 3: Status Switch */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="font-semibold text-slate-800 block">
                Portal Authentication Access
              </span>
              <span className="text-slate-500">
                Allow this employee to authenticate into the Staff Portal
              </span>
            </div>
            <Switch
              checked={formIsActive}
              disabled={selectedItem?.userId === currentUserId}
              onCheckedChange={setFormIsActive}
              badge={true}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700 flex items-center gap-2">
              <Check size={15} className="shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCredentialsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} loading={loading}>
              {selectedItem?.hasUser ? "Save Changes" : "Grant Login Access"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* TOGGLE STATUS CONFIRM DIALOG */}
      {/* ========================================================================= */}
      <ConfirmDialog
        open={toggleStatusDialogOpen}
        onClose={() => setToggleStatusDialogOpen(false)}
        onConfirm={confirmToggleStatus}
        title={selectedItem?.userIsActive ? "Deactivate Portal Access?" : "Activate Portal Access?"}
        description={
          selectedItem?.userIsActive
            ? `Are you sure you want to suspend portal login access for "${selectedItem.fullName}"? They will temporarily not be able to log in to see their employee data.`
            : `Are you sure you want to reactivate portal login access for "${selectedItem?.fullName}"? They will be able to log in immediately.`
        }
        confirmText={selectedItem?.userIsActive ? "Deactivate Access" : "Activate Access"}
        variant={selectedItem?.userIsActive ? "danger" : "default"}
        loading={loading}
      />

      {/* ========================================================================= */}
      {/* REVOKE CREDENTIALS CONFIRM DIALOG */}
      {/* ========================================================================= */}
      <ConfirmDialog
        open={revokeDialogOpen}
        onClose={() => setRevokeDialogOpen(false)}
        onConfirm={confirmRevokeAccess}
        title="Revoke Portal Login Credentials?"
        description={`Are you sure you want to permanently revoke the portal login credentials for "${selectedItem?.fullName}"? Their employee record and payroll details will NOT be deleted, but they will no longer have login access until re-granted.`}
        confirmText="Revoke Login"
        variant="danger"
        loading={loading}
      />
    </div>
  );
}
