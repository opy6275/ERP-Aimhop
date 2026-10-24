import crypto from "crypto";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

const QR_PREFIX = "AIMHOP_OFFICE_ATTENDANCE";
const WALL_POSTER_PREFIX = "AIMHOP_OFFICE_WALL_POSTER";

function getSecretKey(): string {
  return process.env.AUTH_SECRET || "aimhop-erp-qr-secret-key-fallback";
}

/**
 * Generate a cryptographically signed permanent QR URL/Payload for sticking on the office wall
 */
export async function generateOfficeQrPayload(baseUrl?: string) {
  const company = await prisma.company.findFirst();
  const companyId = company?.id || "default";
  const domain = (baseUrl || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

  // Create permanent signature for this company's physical office
  const rawData = `${WALL_POSTER_PREFIX}:${companyId}`;
  const hmac = crypto.createHmac("sha256", getSecretKey());
  hmac.update(rawData);
  const signature = hmac.digest("hex").slice(0, 24);

  // Encode a clean web scan URL so normal phone cameras can open it directly!
  const scanUrl = `${domain || ""}/attendance/scan?cid=${companyId}&sig=${signature}`;

  return {
    scanUrl,
    rawPayload: scanUrl,
    signature,
    companyId,
    companyName: company?.name || "AimHop ERP",
  };
}

/**
 * Validate a scanned QR payload (supports both direct web URL and JSON payload)
 */
export async function verifyOfficeQrPayload(scannedText: string): Promise<{
  valid: boolean;
  message?: string;
  companyId?: string;
}> {
  try {
    if (!scannedText || typeof scannedText !== "string") {
      return { valid: false, message: "Empty QR code data." };
    }

    const text = scannedText.trim();
    let companyId: string | null = null;
    let signature: string | null = null;

    // Check 1: Scanned text is a full URL or URL with query params
    if (text.includes("/attendance/scan") || text.includes("sig=")) {
      try {
        const url = new URL(text, "http://localhost");
        companyId = url.searchParams.get("cid");
        signature = url.searchParams.get("sig");
      } catch {
        // Continue to other parsers
      }
    }

    // Check 2: Scanned text is a JSON object
    if (!signature && (text.startsWith("{") && text.endsWith("}"))) {
      try {
        const json = JSON.parse(text);
        if (json.cid && json.sig) {
          companyId = json.cid;
          signature = json.sig;
        }
      } catch {
        // Continue
      }
    }

    // Check 3: Scanned text is raw "cid:sig" format
    if (!signature && text.includes(":")) {
      const parts = text.split(":");
      if (parts.length >= 2) {
        companyId = parts[0];
        signature = parts[1];
      }
    }

    if (!companyId || !signature) {
      return {
        valid: false,
        message: "Unrecognized QR Code. Kripya official AimHop Office Wall QR scan karein.",
      };
    }

    // Verify cryptographic signature for permanent wall poster
    const rawData = `${WALL_POSTER_PREFIX}:${companyId}`;
    const hmac = crypto.createHmac("sha256", getSecretKey());
    hmac.update(rawData);
    const expectedSig = hmac.digest("hex").slice(0, 24);

    if (signature === expectedSig) {
      return { valid: true, companyId };
    }

    // Fallback: Check daily dynamic signature if legacy
    const todayUtc = new Date().toISOString().slice(0, 10);
    const dailyRaw = `${QR_PREFIX}:${companyId}:${todayUtc}`;
    const dailyHmac = crypto.createHmac("sha256", getSecretKey());
    dailyHmac.update(dailyRaw);
    const expectedDailySig = dailyHmac.digest("hex").slice(0, 16);

    if (signature === expectedDailySig) {
      return { valid: true, companyId };
    }

    return {
      valid: false,
      message: "QR Code verification failed: Invalid or counterfeit office signature.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "QR Verification error";
    return { valid: false, message: msg };
  }
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
    errorCorrectionLevel: "H", // High redundancy for wall posters so scanning is effortless
  });

  return {
    dataUrl,
    payload: scanUrl,
    companyName,
    date: new Date().toISOString().slice(0, 10),
  };
}
