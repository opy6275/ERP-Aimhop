import { NextResponse } from "next/server";
import { requireAuth, requireAdmin, isErrorResponse } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { toDateOnlyUtc } from "@/lib/format";

// Default Indian Gazetted & National Holidays for initial setup
const DEFAULT_HOLIDAYS_2026 = [
  { name: "Republic Day", date: "2026-01-26", type: "national", description: "National Holiday" },
  { name: "Maha Shivratri", date: "2026-02-15", type: "festival", description: "Gazetted Holiday" },
  { name: "Holi", date: "2026-03-04", type: "festival", description: "Festival of Colors" },
  { name: "Eid-ul-Fitr", date: "2026-03-21", type: "festival", description: "Eid Celebration" },
  { name: "Mahavir Jayanti", date: "2026-03-31", type: "gazetted", description: "Gazetted Holiday" },
  { name: "Good Friday", date: "2026-04-03", type: "gazetted", description: "Christian Holiday" },
  { name: "Eid-ul-Adha (Bakrid)", date: "2026-05-28", type: "festival", description: "Gazetted Holiday" },
  { name: "Independence Day", date: "2026-08-15", type: "national", description: "National Holiday" },
  { name: "Raksha Bandhan", date: "2026-08-28", type: "festival", description: "Optional / Restricted" },
  { name: "Janmashtami", date: "2026-09-04", type: "festival", description: "Lord Krishna Birthday" },
  { name: "Gandhi Jayanti", date: "2026-10-02", type: "national", description: "National Holiday" },
  { name: "Dussehra (Vijayadashami)", date: "2026-10-20", type: "festival", description: "Gazetted Holiday" },
  { name: "Diwali (Deepavali)", date: "2026-11-08", type: "festival", description: "Festival of Lights" },
  { name: "Guru Nanak Jayanti", date: "2026-11-24", type: "gazetted", description: "Gurpurab" },
  { name: "Christmas Day", date: "2026-12-25", type: "gazetted", description: "Gazetted Holiday" },
];

export async function GET() {
  const user = await requireAuth();
  if (isErrorResponse(user)) return user;

  try {
    let holidays = await prisma.companyHoliday.findMany({
      orderBy: { date: "asc" },
    });

    // Auto-seed default holidays if table is empty
    if (holidays.length === 0) {
      for (const h of DEFAULT_HOLIDAYS_2026) {
        try {
          await prisma.companyHoliday.create({
            data: {
              name: h.name,
              date: toDateOnlyUtc(new Date(h.date)),
              type: h.type,
              description: h.description,
            },
          });
        } catch {
          // ignore duplicate
        }
      }

      holidays = await prisma.companyHoliday.findMany({
        orderBy: { date: "asc" },
      });
    }

    return NextResponse.json({ data: holidays });
  } catch (err: unknown) {
    console.error("Failed to load holidays:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;

  try {
    const body = await request.json();
    const { name, date, type, description } = body;

    if (!name?.trim() || !date) {
      return NextResponse.json({ error: "Name and date are required" }, { status: 400 });
    }

    const d = toDateOnlyUtc(new Date(date));

    const holiday = await prisma.companyHoliday.create({
      data: {
        name: name.trim(),
        date: d,
        type: type || "gazetted",
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ data: holiday }, { status: 201 });
  } catch (err: unknown) {
    console.error("Failed to create holiday:", err);
    return NextResponse.json({ error: "Failed to create holiday (date may already exist)" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const user = await requireAdmin();
  if (isErrorResponse(user)) return user;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Holiday ID is required" }, { status: 400 });
    }

    await prisma.companyHoliday.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Failed to delete holiday:", err);
    return NextResponse.json({ error: "Failed to delete holiday" }, { status: 500 });
  }
}
