import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  durationMinutes: z.number().int().positive(),
  priceCents: z.number().int().positive(),
  depositType: z.enum(["NONE", "FIXED", "PERCENT"]),
  depositValue: z.number().int().nonnegative(),
  bufferBeforeMinutes: z.number().int().nonnegative(),
  bufferAfterMinutes: z.number().int().nonnegative(),
});

async function guard() {
  const session = await auth();
  return !!session && ["ADMIN", "OWNER", "STAFF"].includes(session.user.role);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const service = await prisma.service.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(service);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.service.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
