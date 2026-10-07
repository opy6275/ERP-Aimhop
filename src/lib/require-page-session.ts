import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const requirePageSession = cache(
  async (opts?: { staffOnly?: boolean; adminOnly?: boolean }) => {
    const session = await getSession();
    if (!session) redirect("/login");

    if (opts?.staffOnly && session.role !== "staff") {
      redirect("/admin/dashboard");
    }
    if (opts?.adminOnly && session.role === "staff") {
      redirect("/app/dashboard");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { role: true, staff: true },
    });

    const roleName = user?.role?.name;
    const roleLabel =
      roleName ??
      (session.role === "super_admin"
        ? "Super Admin"
        : session.role === "admin"
        ? "Admin"
        : "Staff");

    return { session, user, roleLabel };
  },
);

export type PageSession = Awaited<ReturnType<typeof requirePageSession>>;
export type { SessionPayload };
