// Integration test for auth and session signing
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const AUTH_SECRET = process.env.AUTH_SECRET || "dev-only-change-in-production-aimhop-erp";

function toBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqualStr(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

async function hmacKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function sign(data) {
  const key = await hmacKey();
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  return toBase64Url(new Uint8Array(sig));
}

async function encodeSession(payload, maxAgeSec = 3600) {
  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSec,
  };
  const json = toBase64Url(new TextEncoder().encode(JSON.stringify(body)));
  const sig = await sign(json);
  return `${json}.${sig}`;
}

async function decodeSession(token) {
  if (!token) return null;
  const [json, sig] = token.split(".");
  if (!json || !sig) return null;

  const expected = await sign(json);
  if (!timingSafeEqualStr(sig, expected)) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(json))
    );
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

async function run() {
  console.log("=== Testing Authentication & Session Signing ===");

  // 1. Verify super admin user exists and password matches
  const superadmin = await prisma.user.findUnique({
    where: { email: "superadmin@aimhop.com" },
    include: { role: true },
  });
  if (!superadmin) throw new Error("superadmin@aimhop.com not found");
  const isSuperadminValid = await bcrypt.compare("Admin@123", superadmin.passwordHash);
  if (!isSuperadminValid) throw new Error("Password mismatch for superadmin");
  console.log("✔ Super Admin password validated successfully");

  // 2. Verify demo user exists and password matches
  const demo = await prisma.user.findUnique({
    where: { email: "demo@aimhop.com" },
    include: { role: true },
  });
  if (!demo) throw new Error("demo@aimhop.com not found");
  const isDemoValid = await bcrypt.compare("Demo@123", demo.passwordHash);
  if (!isDemoValid) throw new Error("Password mismatch for demo user");
  console.log("✔ Demo user password validated successfully");

  // 3. Verify invalid password rejection
  const isInvalidRejected = await bcrypt.compare("WrongPass!999", superadmin.passwordHash);
  if (isInvalidRejected) throw new Error("Invalid password was unexpectedly accepted");
  console.log("✔ Invalid password correctly rejected");

  // 4. Test session encoding & decoding
  const testPayload = {
    userId: superadmin.id,
    email: superadmin.email,
    role: superadmin.role.slug,
    staffId: superadmin.staffId,
  };

  const token = await encodeSession(testPayload);
  const decoded = await decodeSession(token);

  if (!decoded || decoded.userId !== superadmin.id || decoded.email !== superadmin.email) {
    throw new Error("Session payload decode mismatch: " + JSON.stringify(decoded));
  }
  console.log("✔ Session encode and decode roundtrip successful");

  // 5. Test token tampering rejection
  const tamperedToken = token.slice(0, -4) + "XXXX";
  const tamperedDecoded = await decodeSession(tamperedToken);
  if (tamperedDecoded !== null) {
    throw new Error("Tampered token was unexpectedly accepted");
  }
  console.log("✔ Tampered signature correctly rejected");

  // 6. Test expired token rejection
  const expiredToken = await encodeSession(testPayload, -10);
  const expiredDecoded = await decodeSession(expiredToken);
  if (expiredDecoded !== null) {
    throw new Error("Expired token was unexpectedly accepted");
  }
  console.log("✔ Expired token correctly rejected");

  console.log("\nALL AUTH & SESSION TESTS PASSED! 🎉\n");
}

run()
  .catch((err) => {
    console.error("FAILED:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
