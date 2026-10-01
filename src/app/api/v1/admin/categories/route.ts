import { z } from "zod";
import { isErrorResponse, requirePermission } from "@/lib/rbac";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export async function GET() {
  const user = await requirePermission("categories.read");
  if (isErrorResponse(user)) return user;

  const categories = await prisma.staffCategory.findMany({ orderBy: { name: "asc" } });
  return apiOk({ categories });
}

export async function POST(request: Request) {
  const user = await requirePermission("categories.manage");
  if (isErrorResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid category data", 400);

  const category = await prisma.staffCategory.create({ data: parsed.data });
  await writeAudit({
    actorUserId: user.id,
    action: "category.create",
    entityType: "category",
    entityId: category.id,
    targetLabel: category.name,
  });
  return apiOk({ category }, 201);
}
