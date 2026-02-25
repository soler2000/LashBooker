import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSignedReadUrlOrNull } from "@/lib/s3-storage";
import { NextResponse } from "next/server";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "OWNER", "STAFF"];
const MIN_IMAGES = 1;
const MAX_IMAGES = 6;

const createEntrySchema = z.object({
  bookingId: z.string().uuid(),
  notes: z.string().trim().min(1).max(8000),
  images: z.array(z.object({ objectKey: z.string().min(1), mimeType: z.string().min(1).max(120) })).min(MIN_IMAGES).max(MAX_IMAGES),
});

async function guard() {
  const session = await auth();
  if (!session || !ADMIN_ROLES.includes(session.user.role)) return null;
  return session;
}

function addReadUrls<T extends { images: Array<{ id: string; mimeType: string; objectKey: string; createdAt: Date }> }>(entries: T[]) {
  return entries.map((entry) => ({
    ...entry,
    images: entry.images.map((image) => ({
      id: image.id,
      mimeType: image.mimeType,
      createdAt: image.createdAt,
      readUrl: createSignedReadUrlOrNull(image.objectKey),
    })),
  }));
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const entries = await prisma.journalEntry.findMany({
    where: { clientId: params.id },
    include: {
      booking: { select: { id: true, startAt: true, service: { select: { name: true } } } },
      createdBy: { select: { id: true, email: true } },
      images: { select: { id: true, objectKey: true, mimeType: true, createdAt: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ entries: addReadUrls(entries) });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await guard();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createEntrySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const booking = await prisma.booking.findFirst({
    where: { id: parsed.data.bookingId, clientId: params.id },
    select: { id: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found for client" }, { status: 404 });

  const entry = await prisma.journalEntry.create({
    data: {
      clientId: params.id,
      bookingId: parsed.data.bookingId,
      createdById: session.user.id,
      notes: parsed.data.notes,
      images: {
        createMany: {
          data: parsed.data.images.map((image) => ({ objectKey: image.objectKey, mimeType: image.mimeType })),
        },
      },
    },
    include: {
      booking: { select: { id: true, startAt: true, service: { select: { name: true } } } },
      createdBy: { select: { id: true, email: true } },
      images: { select: { id: true, objectKey: true, mimeType: true, createdAt: true }, orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json({ entry: addReadUrls([entry])[0] }, { status: 201 });
}
