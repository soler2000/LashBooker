import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const hhTimeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/);

const updateSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: hhTimeSchema,
  endTime: hhTimeSchema,
  isClosed: z.boolean(),
}).refine((data) => data.isClosed || data.startTime < data.endTime, {
  message: "startTime must be before endTime when open",
  path: ["endTime"],
});

async function guard() {
  const session = await auth();
  return !!session && ["ADMIN", "OWNER", "STAFF"].includes(session.user.role);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  try {
    const updated = await prisma.workingHours.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Could not update working-hours row" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.workingHours.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
