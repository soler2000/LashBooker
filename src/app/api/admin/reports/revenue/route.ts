import { auth } from "@/lib/auth";
import { calculatePeriodMetrics, getPeriodRanges } from "@/lib/admin-metrics";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !["ADMIN", "OWNER", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const ranges = getPeriodRanges(now);
  const from = ranges.month.start;
  const to = ranges.month.end;

  const [bookings, blockouts, workingHours] = await Promise.all([
    prisma.booking.findMany({
      where: { startAt: { gte: from, lt: to } },
      select: { id: true, startAt: true, endAt: true, status: true, clientId: true, payments: true },
    }),
    prisma.blockout.findMany({ where: { endAt: { gt: from }, startAt: { lt: to } }, select: { startAt: true, endAt: true } }),
    prisma.workingHours.findMany({ select: { weekday: true, startTime: true, endTime: true, isClosed: true } }),
  ]);

  const payload = {
    today: calculatePeriodMetrics(bookings, blockouts, workingHours, ranges.today),
    week: calculatePeriodMetrics(bookings, blockouts, workingHours, ranges.week),
    month: calculatePeriodMetrics(bookings, blockouts, workingHours, ranges.month),
    asOf: now.toISOString(),
  };

  return NextResponse.json(payload);
}
