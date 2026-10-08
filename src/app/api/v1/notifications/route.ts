import { NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/rbac";
import { getRecentNotifications, markNotificationsAsRead } from "@/lib/notifications";

export async function GET() {
  const user = await requireAuth();
  if (isErrorResponse(user)) return user;

  const isAdmin = user.role.slug === "admin" || user.role.slug === "superadmin";
  const notifications = await getRecentNotifications(user.id, isAdmin);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return NextResponse.json({
    data: {
      notifications,
      unreadCount,
    },
  });
}

export async function POST() {
  const user = await requireAuth();
  if (isErrorResponse(user)) return user;

  const isAdmin = user.role.slug === "admin" || user.role.slug === "superadmin";
  await markNotificationsAsRead(user.id, isAdmin);

  return NextResponse.json({ ok: true });
}
