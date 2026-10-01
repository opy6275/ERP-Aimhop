import { prisma } from "@/lib/prisma";

type AuditInput = {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  targetLabel?: string | null;
  changes?: unknown;
  ip?: string | null;
};

export async function writeAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        targetLabel: input.targetLabel ?? null,
        changes: input.changes ? (input.changes as object) : undefined,
        ip: input.ip ?? null,
      },
    });
  } catch {
    // Never fail the primary action because audit write failed
  }
}
