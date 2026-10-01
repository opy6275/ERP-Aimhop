import { NextResponse } from "next/server";
import { clearSessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ message: "Signed out" });
  res.cookies.set(clearSessionCookieOptions());
  return res;
}
