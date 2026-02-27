import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookingWindow, canManageClientBookingStatus, isWithinCutoffWindow } from "@/lib/portal-bookings";
import { sendTemplatedEmail } from "@/lib/email";

const bodySchema = z.object({
  startAt: z.string().datetime(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      client: { include: { clientProfile: true } },
    },
  });

  if (!booking || booking.clientId !== session.user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!canManageClientBookingStatus(booking.status)) {
    return NextResponse.json({ error: "Booking cannot be rescheduled" }, { status: 409 });
  }

  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const cutoffHours = settings?.rescheduleCutoffHours ?? 24;
  if (isWithinCutoffWindow(booking.startAt, cutoffHours)) {
    return NextResponse.json({
      error: `Rescheduling is unavailable within ${cutoffHours} hours of your appointment`,
    }, { status: 409 });
  }

  const nextStartAt = new Date(parsed.data.startAt);
  const nextEndAt = new Date(nextStartAt.getTime() + booking.serviceDurationMinutes * 60_000);
  const nextWindow = bookingWindow(
    { startAt: nextStartAt, endAt: nextEndAt },
    booking.serviceBufferBeforeMinutes,
    booking.serviceBufferAfterMinutes,
  );

  const overlaps = await prisma.booking.findFirst({
    where: {
      id: { not: booking.id },
      status: { in: ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED"] },
      startAt: { lt: nextWindow.end },
      endAt: { gt: nextWindow.start },
    },
  });

  if (overlaps) return NextResponse.json({ error: "Slot no longer available" }, { status: 409 });

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      startAt: nextStartAt,
      endAt: nextEndAt,
    },
  });

  const rescheduleEmail = await sendTemplatedEmail({
    to: booking.client.email,
    templateKey: "booking_change_confirmed",
    variables: {
      bookingId: booking.id,
      firstName: booking.client.clientProfile?.firstName || "there",
      serviceName: booking.serviceName,
      startAt: nextStartAt,
    },
    metadata: { bookingId: booking.id, type: "booking_change_confirmed" },
  });

  if (!rescheduleEmail.ok) {
    console.warn(JSON.stringify({
      event: "booking_reschedule_email_failed",
      bookingId: booking.id,
      email: booking.client.email,
      ...rescheduleEmail,
    }));
  }

  return NextResponse.json({ booking: updated });
}
