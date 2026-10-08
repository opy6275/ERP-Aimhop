import { prisma } from "@/lib/prisma";

export type NotificationType = "leave" | "attendance" | "payment" | "holiday" | "info";

export async function createNotification(params: {
  userId?: string | null;
  title: string;
  message: string;
  type?: NotificationType;
  linkUrl?: string;
}) {
  try {
    return await prisma.appNotification.create({
      data: {
        userId: params.userId || null,
        title: params.title,
        message: params.message,
        type: params.type || "info",
        linkUrl: params.linkUrl || null,
      },
    });
  } catch (err) {
    console.error("Failed to create in-app notification:", err);
    return null;
  }
}

export async function getRecentNotifications(userId?: string | null, isAdmin: boolean = false) {
  try {
    const where = isAdmin
      ? {
          OR: [
            { userId: null },
            ...(userId ? [{ userId }] : []),
          ],
        }
      : { userId: userId || "none" };

    return await prisma.appNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    return [];
  }
}

export async function markNotificationsAsRead(userId?: string | null, isAdmin: boolean = false) {
  try {
    const where = isAdmin
      ? {
          OR: [
            { userId: null },
            ...(userId ? [{ userId }] : []),
          ],
        }
      : { userId: userId || "none" };

    await prisma.appNotification.updateMany({
      where,
      data: { isRead: true },
    });
    return true;
  } catch (err) {
    console.error("Failed to mark notifications as read:", err);
    return false;
  }
}
