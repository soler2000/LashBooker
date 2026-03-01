import { auth } from "@/lib/auth";
import { calculateClientMetrics, getPeriodRanges } from "@/lib/admin-metrics";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !["ADMIN", "OWNER", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const ranges = getPeriodRanges(now);

  const bookings = await prisma.booking.findMany({
    where: { startAt: { gte: ranges.month.start, lt: ranges.month.end } },
    select: { id: true, startAt: true, endAt: true, status: true, clientId: true, paidAmountCents: true, payments: true },
  });

  return NextResponse.json({
    today: calculateClientMetrics(bookings, ranges.today),
    week: calculateClientMetrics(bookings, ranges.week),
    month: calculateClientMetrics(bookings, ranges.month),
    asOf: now.toISOString(),
  });
}
