import crypto from "crypto";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

const QR_PREFIX = "AIMHOP_OFFICE_ATTENDANCE";
const WALL_POSTER_PREFIX = "AIMHOP_OFFICE_WALL_POSTER";

function getSecretKey(): string {
  return process.env.AUTH_SECRET || "aimhop-erp-qr-secret-key-fallback";
}

/**
 * Generate permanent cryptographic signature for this company's physical office
 */
export function getWallPosterSignature(companyId: string): string {
  const rawData = `${WALL_POSTER_PREFIX}:${companyId}`;
  const hmac = crypto.createHmac("sha256", getSecretKey());
  hmac.update(rawData);
  return hmac.digest("hex").slice(0, 24);
}

/**
 * Generate a cryptographically signed permanent QR URL/Payload for the office wall
 */
export async function generateOfficeQrPayload(baseUrl?: string) {
  const company = await prisma.company.findFirst();
  const companyId = company?.id || "default-company";
  const domain = (baseUrl || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

  const signature = getWallPosterSignature(companyId);

  // Encode a clean web scan URL so normal phone cameras can open it directly!
  const scanUrl = `${domain || ""}/attendance/scan?cid=${encodeURIComponent(companyId)}&sig=${encodeURIComponent(signature)}`;

  return {
    scanUrl,
    rawPayload: scanUrl,
    signature,
    companyId,
    companyName: company?.name || "AimHop ERP",
  };
}

/**
 * Robustly extract cid & sig from any scanned string (URL, query string, JSON, or colon-delimited)
 */
export function parseOfficeQrText(scannedText: string): { cid: string | null; sig: string | null } {
  if (!scannedText || typeof scannedText !== "string") {
    return { cid: null, sig: null };
  }

  const text = scannedText.trim();

  // 1. If text contains query parameters (e.g. "https://erp.aimhop.com/attendance/scan?cid=...&sig=..." or "cid=...&sig=...")
  if (text.includes("cid=") || text.includes("sig=")) {
    const queryPart = text.includes("?") ? text.split("?")[1] : text;
    try {
      const params = new URLSearchParams(queryPart);
      const cid = params.get("cid");
      const sig = params.get("sig");
      if (cid && sig) return { cid, sig };
    } catch {
      // Fall through
    }
  }

  // 2. If text is JSON (e.g. {"cid":"...", "sig":"..."})
  if (text.startsWith("{") && text.endsWith("}")) {
    try {
      const json = JSON.parse(text);
      if (json.cid && json.sig) return { cid: String(json.cid), sig: String(json.sig) };
    } catch {
      // Fall through
    }
  }

  // 3. If text is "cid:sig" format
  if (text.includes(":")) {
    const parts = text.split(":");
    if (parts.length >= 2) {
      return { cid: parts[0] || null, sig: parts[1] || null };
    }
  }

  return { cid: null, sig: null };
}

/**
 * Direct signature verification with support for both permanent wall QR and legacy daily token
 */
export function verifyOfficeSignature(
  companyId: string | null | undefined,
  signature: string | null | undefined
): { valid: boolean; message?: string } {
  if (!companyId || !signature) {
    return {
      valid: false,
      message: "QR Code data incomplete. Kripya official AimHop Office Wall QR scan karein.",
    };
  }

  // 1. Check permanent wall signature
  const expectedWallSig = getWallPosterSignature(companyId);
  if (signature === expectedWallSig) {
    return { valid: true };
  }

  // 2. Fallback: check today's dynamic signature if legacy
  const todayUtc = new Date().toISOString().slice(0, 10);
  const dailyRaw = `${QR_PREFIX}:${companyId}:${todayUtc}`;
  const dailyHmac = crypto.createHmac("sha256", getSecretKey());
  dailyHmac.update(dailyRaw);
  const expectedDailySig = dailyHmac.digest("hex").slice(0, 16);

  if (signature === expectedDailySig) {
    return { valid: true };
  }

  return {
    valid: false,
    message: "Invalid or unrecognized Office QR code. Kripya office mein laga official poster scan karein.",
  };
}

/**
 * Validate a scanned QR payload (any string format)
 */
export async function verifyOfficeQrPayload(scannedText: string): Promise<{
  valid: boolean;
  message?: string;
  companyId?: string;
}> {
  const { cid, sig } = parseOfficeQrText(scannedText);
  if (!cid || !sig) {
    return {
      valid: false,
      message: "Unrecognized QR Code. Kripya official AimHop Office Wall QR scan karein.",
    };
  }

  const result = verifyOfficeSignature(cid, sig);
  if (!result.valid) {
    return { valid: false, message: result.message };
  }

  return { valid: true, companyId: cid };
}

/**
 * Generate high-definition QR code data URL (PNG) for printing and wall display
 */
export async function generateOfficeQrDataUrl(baseUrl?: string): Promise<{
  dataUrl: string;
  payload: string;
  companyName: string;
  date: string;
}> {
  const { scanUrl, companyName } = await generateOfficeQrPayload(baseUrl);
  const dataUrl = await QRCode.toDataURL(scanUrl, {
    width: 450,
    margin: 2,
    color: {
      dark: "#0f172a", // slate-900
      light: "#ffffff",
    },
    errorCorrectionLevel: "H", // High redundancy for effortless phone camera scanning
  });

  return {
    dataUrl,
    payload: scanUrl,
    companyName,
    date: new Date().toISOString().slice(0, 10),
  };
}
