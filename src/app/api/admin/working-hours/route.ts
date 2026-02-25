import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const hhTimeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/);

const workingHoursSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: hhTimeSchema,
  endTime: hhTimeSchema,
  isClosed: z.boolean().default(false),
}).refine((data) => data.isClosed || data.startTime < data.endTime, {
  message: "startTime must be before endTime when open",
  path: ["endTime"],
});

async function guard() {
  const session = await auth();
  return !!session && ["ADMIN", "OWNER", "STAFF"].includes(session.user.role);
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await prisma.workingHours.findMany({ orderBy: { weekday: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = workingHoursSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  try {
    const created = await prisma.workingHours.create({ data: parsed.data });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A row for this weekday already exists" }, { status: 409 });
  }
}
