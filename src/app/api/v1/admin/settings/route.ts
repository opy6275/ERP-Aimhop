import { z } from "zod";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1).max(120),
  legalName: z.string().max(160).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  currency: z.string().min(1).max(10).default("INR"),
  timezone: z.string().min(1).max(50).default("Asia/Kolkata"),
  receiptFooter: z.string().max(500).optional().nullable(),
});

export async function GET() {
  const user = await requirePermission("settings.manage");
  if (isErrorResponse(user)) return user;

  const company = await prisma.company.findFirst();
  return apiOk({ company });
}

export async function PATCH(request: Request) {
  const user = await requirePermission("settings.manage");
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid company settings payload", 400, {
      detail: parsed.error.issues[0]?.message,
    });
  }

  const existing = await prisma.company.findFirst();
  const d = parsed.data;

  let company;
  if (existing) {
    company = await prisma.company.update({
      where: { id: existing.id },
      data: {
        name: d.name,
        legalName: d.legalName,
        address: d.address,
        currency: d.currency,
        timezone: d.timezone,
        receiptFooter: d.receiptFooter,
      },
    });
  } else {
    company = await prisma.company.create({
      data: {
        name: d.name,
        legalName: d.legalName,
        address: d.address,
        currency: d.currency,
        timezone: d.timezone,
        receiptFooter: d.receiptFooter,
      },
    });
  }

  await writeAudit({
    actorUserId: user.id,
    action: "settings.update",
    entityType: "company",
    entityId: company.id,
    targetLabel: company.name,
    changes: d,
  });

  return apiOk({ company, message: "Company settings updated successfully" });
}
