import { redirect } from "next/navigation";

const MAP: Record<string, string> = {
  staff: "/admin/staff",
  departments: "/admin/departments",
  categories: "/admin/categories",
  attendance: "/admin/attendance",
  payments: "/admin/payments",
  receipts: "/admin/receipts",
  reports: "/admin/reports",
  users: "/admin/users",
  settings: "/admin/settings",
  "audit-logs": "/admin/audit-logs",
};

export default async function AdminSectionRedirect({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  redirect(MAP[section] ?? "/admin/dashboard");
}
