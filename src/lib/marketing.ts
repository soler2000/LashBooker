import { CampaignSegmentType, BookingStatus, PaymentStatus } from "@prisma/client";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export const SEGMENT_LABELS: Record<string, CampaignSegmentType> = {
  lapsed: "LAPSED",
  vip: "VIP",
  "infill-due": "INFILL_DUE",
};

export type SegmentApiType = keyof typeof SEGMENT_LABELS;

export function parseSegmentType(type: string): CampaignSegmentType | null {
  return SEGMENT_LABELS[type] ?? null;
}

export type SegmentRecipient = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
};

export async function getSegmentRecipients(segmentType: CampaignSegmentType): Promise<SegmentRecipient[]> {
  const baseClients = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      clientProfile: { marketingConsent: true },
    },
    select: {
      id: true,
      email: true,
      clientProfile: { select: { firstName: true, lastName: true } },
      bookings: {
        where: {
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        },
        select: {
          startAt: true,
          payments: {
            where: { status: PaymentStatus.SUCCEEDED },
            select: { amountCents: true },
          },
        },
        orderBy: { startAt: "desc" },
      },
    },
  });

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  return baseClients.filter((client) => {
    const lastBooking = client.bookings[0]?.startAt;
    const totalSpent = client.bookings.reduce((sum, booking) => sum + booking.payments.reduce((pSum, payment) => pSum + payment.amountCents, 0), 0);

    if (segmentType === "LAPSED") {
      if (!lastBooking) return false;
      const daysSince = (now.getTime() - lastBooking.getTime()) / dayMs;
      return daysSince >= 45;
    }

    if (segmentType === "VIP") {
      return totalSpent >= 50000;
    }

    if (segmentType === "INFILL_DUE") {
      if (!lastBooking) return false;
      const daysSince = (now.getTime() - lastBooking.getTime()) / dayMs;
      return daysSince >= 14 && daysSince <= 28;
    }

    return false;
  }).map((client) => ({
    userId: client.id,
    email: client.email,
    firstName: client.clientProfile?.firstName ?? "",
    lastName: client.clientProfile?.lastName ?? "",
  }));
}

export function createUnsubscribeToken(userId: string): string {
  const secret = process.env.MARKETING_UNSUBSCRIBE_SECRET || process.env.AUTH_SECRET || "lashbooker-marketing-fallback";
  const payload = `${userId}.${Date.now()}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export function verifyUnsubscribeToken(token: string): string | null {
  const secret = process.env.MARKETING_UNSUBSCRIBE_SECRET || process.env.AUTH_SECRET || "lashbooker-marketing-fallback";

  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const [userId, issuedAtRaw, signature] = decoded.split(".");
  if (!userId || !issuedAtRaw || !signature) return null;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return null;

  const maxAgeMs = 1000 * 60 * 60 * 24 * 365;
  if (Date.now() - issuedAt > maxAgeMs) return null;

  const payload = `${userId}.${issuedAtRaw}`;
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  return userId;
}

export function buildUnsubscribeUrl(userId: string) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const token = createUnsubscribeToken(userId);
  return `${baseUrl.replace(/\/$/, "")}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}
