import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function guard() {
  const session = await auth();
  return !!session && ["ADMIN", "OWNER"].includes(session.user.role);
}

export async function GET() {
  if (!(await guard())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await prisma.transactionalEmailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      recipientUser: {
        select: {
          email: true,
        },
      },
      booking: {
        select: {
          id: true,
          startAt: true,
          status: true,
        },
      },
    },
  });

  return NextResponse.json(logs);
}
