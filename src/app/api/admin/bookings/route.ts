import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const roleAllowlist = ["ADMIN", "OWNER", "STAFF"];

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

  const statuses = parsed.data.status?.split(",").filter(Boolean) as Array<
    "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED_BY_CLIENT" | "CANCELLED_BY_ADMIN" | "NO_SHOW"
  > | undefined;

  const where = {
    ...(parsed.data.startAt || parsed.data.endAt
      ? {
          startAt: {
            ...(parsed.data.startAt ? { gte: new Date(parsed.data.startAt) } : {}),
            ...(parsed.data.endAt ? { lt: new Date(parsed.data.endAt) } : {}),
          },
        }
      : {}),
    ...(statuses?.length ? { status: { in: statuses } } : {}),
  };

  const [bookings, blockouts] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        service: { select: { name: true, durationMinutes: true } },
        client: { select: { email: true } },
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

  const existing = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
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
      service: { select: { name: true, durationMinutes: true } },
      client: { select: { email: true } },
      payments: { select: { amountCents: true, status: true, capturedAt: true } },
    },
  });

  return NextResponse.json(updated);
}
