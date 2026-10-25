import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import { getRecentNotifications, markNotificationsAsRead } from "@/lib/notifications";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in required", 401);

  const isAdmin = session.role === "admin" || session.role === "super_admin" || session.role === "superadmin";
  const notifications = await getRecentNotifications(session.userId, isAdmin);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return NextResponse.json({
    data: {
      notifications,
      unreadCount,
    },
  });
}

export async function POST() {
  const session = await getSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in required", 401);

  const isAdmin = session.role === "admin" || session.role === "super_admin" || session.role === "superadmin";
  await markNotificationsAsRead(session.userId, isAdmin);

  return NextResponse.json({ ok: true });
}

