import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function guard() {
  const session = await auth();
  return !!session && ["ADMIN", "OWNER", "STAFF"].includes(session.user.role);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const service = await prisma.service.update({ where: { id: params.id }, data: body });
  return NextResponse.json(service);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.service.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
