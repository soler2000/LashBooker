import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendLoggedTransactionalEmail, sendTemplatedEmail } from "@/lib/email";

const roleAllowlist = ["ADMIN", "OWNER", "STAFF"];
const CALENDAR_BLOCKING_STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "NO_SHOW"] as const;

const querySchema = z.object({
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  status: z.string().optional(),
});

const updateSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum([
    "PENDING_PAYMENT",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED_BY_CLIENT",
    "CANCELLED_BY_ADMIN",
    "NO_SHOW",
  ]).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  notes: z.string().optional(),
}).refine((data) => data.status || data.startAt || data.endAt || data.notes !== undefined, {
  message: "At least one field must be updated",
});

async function guard() {
  const session = await auth();
  return !!session && roleAllowlist.includes(session.user.role);
}

export async function GET(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const statuses = (parsed.data.status?.split(",").filter(Boolean) as Array<
    "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED_BY_CLIENT" | "CANCELLED_BY_ADMIN" | "NO_SHOW"
  > | undefined) ?? [...CALENDAR_BLOCKING_STATUSES];

  const where = {
    ...(parsed.data.startAt || parsed.data.endAt
      ? {
          startAt: {
            ...(parsed.data.startAt ? { gte: new Date(parsed.data.startAt) } : {}),
            ...(parsed.data.endAt ? { lt: new Date(parsed.data.endAt) } : {}),
          },
        }
      : {}),
    ...(statuses.length ? { status: { in: statuses } } : {}),
  };

  const [bookings, blockouts] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        client: { select: { id: true, email: true, clientProfile: { select: { firstName: true, lastName: true, phone: true } } } },
        payments: { select: { amountCents: true, status: true, capturedAt: true } },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.blockout.findMany({
      where: {
        ...(parsed.data.startAt ? { endAt: { gt: new Date(parsed.data.startAt) } } : {}),
        ...(parsed.data.endAt ? { startAt: { lt: new Date(parsed.data.endAt) } } : {}),
      },
      orderBy: { startAt: "asc" },
    }),
  ]);

  return NextResponse.json({ bookings, blockouts });
}

export async function PUT(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const existing = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: {
      client: { include: { clientProfile: true } },
    },
  });
  if (!existing) return NextResponse.json({ error: "Booking missing" }, { status: 404 });

  const nextStartAt = parsed.data.startAt ? new Date(parsed.data.startAt) : existing.startAt;
  const nextEndAt = parsed.data.endAt ? new Date(parsed.data.endAt) : existing.endAt;
  if (nextStartAt >= nextEndAt) return NextResponse.json({ error: "startAt must be before endAt" }, { status: 400 });

  const updated = await prisma.booking.update({
    where: { id: parsed.data.bookingId },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
      ...(parsed.data.startAt ? { startAt: nextStartAt } : {}),
      ...(parsed.data.endAt ? { endAt: nextEndAt } : {}),
    },
    include: {
      client: { include: { clientProfile: true } },
      payments: { select: { amountCents: true, status: true, capturedAt: true } },
    },
  });

  const firstName = updated.client.clientProfile?.firstName || "there";
  const timeChanged = parsed.data.startAt !== undefined || parsed.data.endAt !== undefined;
  const statusChanged = parsed.data.status !== undefined && parsed.data.status !== existing.status;

  if (statusChanged && (parsed.data.status === "CANCELLED_BY_ADMIN" || parsed.data.status === "CANCELLED_BY_CLIENT")) {
    const cancellationEmail = await sendTemplatedEmail({
      to: updated.client.email,
      templateKey: "booking_cancellation_confirmed",
      variables: {
        bookingId: updated.id,
        firstName,
        serviceName: updated.serviceName,
        startAt: updated.startAt,
      },
      metadata: { bookingId: updated.id, type: "booking_cancellation_confirmed" },
    });

    if (!cancellationEmail.ok) {
      console.warn(JSON.stringify({
        event: "admin_booking_cancellation_email_failed",
        bookingId: updated.id,
        email: updated.client.email,
        ...cancellationEmail,
      }));
    }
  }

  if (timeChanged) {
    const changeEmail = await sendTemplatedEmail({
      to: updated.client.email,
      templateKey: "booking_change_confirmed",
      variables: {
        bookingId: updated.id,
        firstName,
        serviceName: updated.serviceName,
        startAt: updated.startAt,
      },
      metadata: { bookingId: updated.id, type: "booking_change_confirmed" },
    });

    if (!changeEmail.ok) {
      console.warn(JSON.stringify({
        event: "admin_booking_change_email_failed",
        bookingId: updated.id,
        email: updated.client.email,
        ...changeEmail,
      }));
    }
  }

  if (statusChanged && parsed.data.status === "NO_SHOW") {
    const noShowEmail = await sendLoggedTransactionalEmail({
      to: updated.client.email,
      templateKey: "missed_booking_notification",
      variables: {
        bookingId: updated.id,
        firstName,
        serviceName: updated.serviceName,
        startAt: updated.startAt,
      },
      metadata: { bookingId: updated.id, type: "missed_booking_notification" },
      bookingId: updated.id,
      recipientUserId: updated.clientId,
      dedupeKey: `no_show:${updated.id}`,
    });

    if (!noShowEmail.ok) {
      console.warn(JSON.stringify({
        event: "admin_booking_no_show_email_failed",
        bookingId: updated.id,
        email: updated.client.email,
        ...noShowEmail,
      }));
    }
  }

  return NextResponse.json(updated);
}
