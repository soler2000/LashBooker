import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function guard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    return null;
  }

  return session.user;
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const currentUser = await guard();
  if (!currentUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  if (id === currentUser.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target || target.role === "CLIENT") {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (target.role === "OWNER") {
    const ownerCount = await prisma.user.count({ where: { role: "OWNER" } });
    if (ownerCount <= 1) {
      return NextResponse.json({ error: "At least one owner account is required." }, { status: 400 });
    }
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
