import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const blockoutSchema = z.object({
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  reason: z.string().trim().min(1),
}).refine((data) => data.startAt < data.endAt, {
  message: "startAt must be before endAt",
  path: ["endAt"],
});

async function guard() {
  const session = await auth();
  return !!session && ["ADMIN", "OWNER", "STAFF"].includes(session.user.role);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = blockoutSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const updated = await prisma.blockout.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.blockout.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
