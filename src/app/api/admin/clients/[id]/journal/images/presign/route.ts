import crypto from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSignedUploadUrl, hasS3StorageConfig } from "@/lib/s3-storage";
import { NextResponse } from "next/server";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "OWNER", "STAFF"];

const presignSchema = z.object({
  bookingId: z.string().uuid(),
  contentType: z.string().min(1).max(120),
  ext: z.string().trim().max(16).optional(),
});

function sanitizeExtension(ext?: string) {
  if (!ext) return "jpg";
  const normalized = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalized || "jpg";
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!hasS3StorageConfig()) {
    return NextResponse.json({ error: "Storage is not configured" }, { status: 503 });
  }

  const parsed = presignSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const booking = await prisma.booking.findFirst({
    where: { id: parsed.data.bookingId, clientId: params.id },
    select: { id: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found for client" }, { status: 404 });

  const objectKey = `journal/${params.id}/${parsed.data.bookingId}/${crypto.randomUUID()}.${sanitizeExtension(parsed.data.ext)}`;
  const uploadUrl = createSignedUploadUrl(objectKey, parsed.data.contentType);

  return NextResponse.json({ objectKey, uploadUrl });
}
