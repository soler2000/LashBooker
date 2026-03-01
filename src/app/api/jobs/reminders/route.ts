import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasValidCronSecret } from "@/lib/cron-auth";
import { sendBookingReminderEmail } from "@/lib/email";

export async function POST(req: Request) {
  if (!hasValidCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const configuredSchedule = settings?.reminderScheduleJson ?? "[48,24]";

  let schedule: number[] = [48, 24];
  try {
    const parsed = JSON.parse(configuredSchedule);
    if (Array.isArray(parsed)) {
      schedule = parsed.filter((value): value is number => typeof value === "number" && value > 0);
    }
  } catch {
    schedule = [48, 24];
  }

  const now = Date.now();
  const oneHourMs = 60 * 60 * 1000;
  const sent: Array<{ bookingId: string; hours: number }> = [];
  const skipped: Array<{ bookingId: string; hours: number }> = [];

  for (const hours of schedule) {
    const windowStart = new Date(now + hours * oneHourMs);
    const windowEnd = new Date(windowStart.getTime() + oneHourMs);

    const bookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        startAt: { gte: windowStart, lt: windowEnd },
      },
      include: { client: { include: { clientProfile: true } } },
    });

    for (const booking of bookings) {
      const result = await sendBookingReminderEmail({
        to: booking.client.email,
        bookingId: booking.id,
        firstName: booking.client.clientProfile?.firstName || "there",
        serviceName: booking.serviceName,
        startAt: booking.startAt,
        scheduledHours: hours,
        recipientUserId: booking.clientId,
      });

      if (result.skipped) {
        skipped.push({ bookingId: booking.id, hours });
      } else if (result.ok) {
        sent.push({ bookingId: booking.id, hours });
      }
    }
  }

  return NextResponse.json({ sentCount: sent.length, skippedCount: skipped.length, sent, skipped });
}
