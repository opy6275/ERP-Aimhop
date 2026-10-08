import { NextResponse } from "next/server";
import { requireAuth, requireAdmin, isErrorResponse } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth();
  if (isErrorResponse(user)) return user;

  const { id: staffId } = await params;

  // If staff role, verify they are only requesting their own documents
  if (user.role.slug === "staff" && user.staffId !== staffId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const docs = await prisma.staffDocument.findMany({
      where: { staffId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        fileName: true,
        fileKey: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: docs });
  } catch (err: unknown) {
    console.error("Failed to load documents:", err);
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth();
  if (isErrorResponse(user)) return user;

  const { id: staffId } = await params;

  // If staff role, verify they are uploading to their own profile
  if (user.role.slug === "staff" && user.staffId !== staffId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, fileName, fileData } = body;

    if (!type || !fileName || !fileData) {
      return NextResponse.json(
        { error: "Document type, file name, and file data are required" },
        { status: 400 },
      );
    }

    const doc = await prisma.staffDocument.create({
      data: {
        staffId,
        type: type.toLowerCase(),
        fileName: fileName.trim(),
        fileKey: fileData, // Stores Data URI (base64)
        uploadedById: user.id,
      },
    });

    await writeAudit({
      actorUserId: user.id,
      action: "staff.document_upload",
      entityType: "staff_document",
      entityId: doc.id,
      targetLabel: `${fileName} (${type.toUpperCase()}) uploaded for staff ID ${staffId}`,
    });

    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (err: unknown) {
    console.error("Failed to upload document:", err);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;

  try {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get("docId");

    if (!docId) {
      return NextResponse.json({ error: "docId parameter required" }, { status: 400 });
    }

    await prisma.staffDocument.delete({
      where: { id: docId },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Failed to delete document:", err);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
