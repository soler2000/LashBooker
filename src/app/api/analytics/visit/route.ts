import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_EVENTS_PER_WINDOW = 120;
const RATE_LIMIT_WINDOW_MS = 60_000;
const ipHits = new Map<string, { count: number; resetAt: number }>();

const bodySchema = z.object({
  path: z
    .string()
    .min(1)
    .max(500)
    .refine((value) => value.startsWith("/"), "Path must start with '/'"),
  timestamp: z.string().datetime(),
  sessionId: z.string().min(12).max(128),
  visitorKey: z.string().min(12).max(128),
  referrer: z.string().url().max(500).nullable().optional(),
  durationSeconds: z.number().int().min(0).max(60 * 60 * 4).nullable().optional(),
});

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const current = ipHits.get(ip);

  if (!current || now > current.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (current.count >= MAX_EVENTS_PER_WINDOW) {
    return true;
  }

  current.count += 1;
  return false;
}

async function parseBody(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return req.json();
  }

  const text = await req.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const rawBody = await parseBody(req);
  const parsed = bodySchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const visitedAt = new Date(parsed.data.timestamp);
  const now = Date.now();
  const driftMs = Math.abs(now - visitedAt.getTime());
  if (driftMs > 1000 * 60 * 60 * 24 * 7) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const session = await auth();

  const previousSessionsCount = await prisma.visitorSession.count({
    where: {
      visitorKey: parsed.data.visitorKey,
      id: { not: parsed.data.sessionId },
    },
  });

  const visitorSession = await prisma.visitorSession.upsert({
    where: { id: parsed.data.sessionId },
    create: {
      id: parsed.data.sessionId,
      visitorKey: parsed.data.visitorKey,
      startedAt: visitedAt,
      lastSeenAt: visitedAt,
      isNewVisitor: previousSessionsCount === 0,
      userAgent: req.headers.get("user-agent") || undefined,
      userId: session?.user?.id,
    },
    update: {
      visitorKey: parsed.data.visitorKey,
      lastSeenAt: visitedAt,
      isNewVisitor: previousSessionsCount === 0,
      userAgent: req.headers.get("user-agent") || undefined,
      userId: session?.user?.id,
    },
  });

  const visit = await prisma.pageVisit.create({
    data: {
      visitorSessionId: visitorSession.id,
      path: parsed.data.path,
      referrer: parsed.data.referrer ?? undefined,
      visitedAt,
      durationSeconds: parsed.data.durationSeconds ?? undefined,
    },
  });

  return NextResponse.json({
    ok: true,
    visitId: visit.id,
    isNewVisitor: visitorSession.isNewVisitor,
    isReturningVisitor: !visitorSession.isNewVisitor,
  });
}
