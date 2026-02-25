import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const [upcoming, past] = await Promise.all([
    prisma.booking.findMany({
      where: { clientId: session.user.id, startAt: { gte: now } },
      include: { service: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { clientId: session.user.id, startAt: { lt: now } },
      include: { service: true },
      orderBy: { startAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({ upcoming, past });
}
