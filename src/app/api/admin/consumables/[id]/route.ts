import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().trim().min(1),
  unit: z.string().trim().max(30).optional().or(z.literal("")),
  targetStock: z.number().int().nonnegative(),
  currentStock: z.number().int().nonnegative(),
  isActive: z.boolean().optional(),
});

async function guard() {
  const session = await auth();
  return !!session && ["ADMIN", "OWNER", "STAFF"].includes(session.user.role);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const consumable = await prisma.consumable.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      unit: parsed.data.unit?.trim() || null,
    },
  });

  return NextResponse.json(consumable);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.consumable.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
