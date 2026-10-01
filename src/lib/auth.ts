import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  COOKIE_NAME,
  MAX_AGE_SEC,
  decodeSession,
  encodeSession,
  type SessionPayload,
} from "@/lib/session";

export {
  COOKIE_NAME,
  MAX_AGE_SEC,
  decodeSession,
  encodeSession,
  type SessionPayload,
};

export type AuthUser = {
  id: string;
  email: string;
  role: { id: string; slug: string; name: string };
  staffId: string | null;
  permissions: string[];
  isActive: boolean;
};

export async function getSession() {
  const jar = await cookies();
  return decodeSession(jar.get(COOKIE_NAME)?.value);
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    email: user.email,
    role: { id: user.role.id, slug: user.role.slug, name: user.role.name },
    staffId: user.staffId,
    permissions: user.role.permissions.map((rp) => rp.permission.key),
    isActive: user.isActive,
  };
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

export function hasPermission(user: AuthUser, key: string) {
  return user.permissions.includes(key);
}

export function hasAnyPermission(user: AuthUser, keys: string[]) {
  return keys.some((k) => user.permissions.includes(k));
}