import { NextResponse } from "next/server";

export function apiError(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string>,
) {
  return NextResponse.json({ code, message, ...(fields ? { fields } : {}) }, { status });
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function notFound(message = "Not found") {
  return apiError("NOT_FOUND", message, 404);
}
