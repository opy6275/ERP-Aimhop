"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, AlertTriangle } from "@/components/ui/icons";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type StaffOption = {
  id: string;
  fullName: string;
  staffCode: string;
  designation?: string | null;
};

type DeptData = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
  staffCount: number;
  headStaffId?: string | null;
  headStaff?: {
    id: string;
    fullName: string;
    staffCode: string;
    designation?: string | null;
  } | null;
};

export function DepartmentActions({
  department,
  staff = [],
}: {
  department: DeptData;
  staff?: StaffOption[];
}) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBlockedOpen, setIsBlockedOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      code: String(fd.get("code") || "") || null,
      description: String(fd.get("description") || "") || null,
      headStaffId: String(fd.get("headStaffId") || "") || null,
      status: String(fd.get("status") || "active"),
    };

    try {
      const res = await fetch(`/api/v1/admin/departments/${department.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Could not update department");
        return;
      }
      setIsEditOpen(false);
      router.refresh();
    } catch {
      setError("Network communication error");
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteClick() {
    if (department.staffCount > 0) {
      setIsBlockedOpen(true);
      return;
    }
    setIsDeleteOpen(true);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/departments/${department.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Could not delete department");
        return;
      }
      setIsDeleteOpen(false);
      router.refresh();
    } catch {
      setError("Network error while deleting department");
    } finally {
      setDeleting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition hover:border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1";

  return (
    <>
      <div className="flex items-center gap-1.5 justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setError(null);
            setIsEditOpen(true);
          }}
          className="h-7 px-2.5 text-xs text-slate-700 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50"
        >
          <Pencil size={12} className="text-slate-500" />
          <span>Edit</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={deleting}
          onClick={handleDeleteClick}
          className="h-7 px-2.5 text-xs text-rose-600 border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700"
        >
          <Trash2 size={12} className="text-rose-500" />
          <span>Delete</span>
        </Button>
      </div>

      {/* Edit Modal */}
      <Modal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Department"
        description="Update department designation, code, and operational status."
        size="default"
      >
        <form onSubmit={onUpdate} className="space-y-4">
          <div>
            <label className={labelClass}>Department Name *</label>
            <input name="name" required defaultValue={department.name} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Short Code</label>
            <input
              name="code"
              defaultValue={department.code || ""}
              className={`${inputClass} font-mono uppercase`}
            />
          </div>

          <div>
            <label className={labelClass}>Operational Status</label>
            <select name="status" defaultValue={department.status} className={inputClass}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Description / Scope</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={department.description || ""}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Head of Department (HOD)</label>
            <select
              name="headStaffId"
              defaultValue={department.headStaffId || ""}
              className={inputClass}
            >
              <option value="">No Department Head (Unassigned)</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.staffCode}){s.designation ? ` — ${s.designation}` : ""}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Department"
        description={`Are you sure you want to permanently delete the '${department.name}' department? This action cannot be undone.`}
        confirmText="Delete Department"
        confirmTone="danger"
        loading={deleting}
      />

      {/* Blocked Deletion Modal (Has Assigned Staff) */}
      <Modal
        open={isBlockedOpen}
        onClose={() => setIsBlockedOpen(false)}
        title="Cannot Delete Department"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Cannot delete <strong>&apos;{department.name}&apos;</strong> because{" "}
              <strong>{department.staffCount} employee(s)</strong> are currently assigned to it.
              Please reassign those employees to another department first.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="default"
              onClick={() => setIsBlockedOpen(false)}
            >
              Understood
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
