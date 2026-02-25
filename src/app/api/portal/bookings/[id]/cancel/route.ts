import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageClientBookingStatus, isWithinCutoffWindow } from "@/lib/portal-bookings";

export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking || booking.clientId !== session.user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!canManageClientBookingStatus(booking.status)) {
    return NextResponse.json({ error: "Booking cannot be canceled" }, { status: 409 });
  }

  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const cutoffHours = settings?.cancelCutoffHours ?? 24;
  if (isWithinCutoffWindow(booking.startAt, cutoffHours)) {
    return NextResponse.json({
      error: `Cancellation is unavailable within ${cutoffHours} hours of your appointment`,
    }, { status: 409 });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED_BY_CLIENT" },
    include: { service: true },
  });

  return NextResponse.json({ booking: updated });
}
