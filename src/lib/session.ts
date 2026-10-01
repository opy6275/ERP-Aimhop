/**
 * Edge-compatible session encode/decode (Web Crypto).
 * Safe for Next.js middleware — do not import Node crypto or Prisma here.
 */

export const COOKIE_NAME = "aimhop_session";
export const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: string;
  email: string;
  role: string;
  staffId?: string | null;
  exp: number;
};

function secret() {
  return process.env.AUTH_SECRET ?? "dev-only-change-in-production-aimhop-erp";
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i)! ^ b.charCodeAt(i)!;
  }
  return out === 0;
}

async function hmacKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function sign(data: string): Promise<string> {
  const key = await hmacKey();
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return toBase64Url(new Uint8Array(sig));
}

export async function encodeSession(
  payload: Omit<SessionPayload, "exp">,
  maxAgeSec = MAX_AGE_SEC,
): Promise<string> {
  const body: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSec,
  };
  const json = toBase64Url(new TextEncoder().encode(JSON.stringify(body)));
  const sig = await sign(json);
  return `${json}.${sig}`;
}

export async function decodeSession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [json, sig] = token.split(".");
  if (!json || !sig) return null;

  const expected = await sign(json);
  if (!timingSafeEqualStr(sig, expected)) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(json)),
    ) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}