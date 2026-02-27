import { auth } from "@/lib/auth";
import { buildVisitorsReportResponse, parseVisitorsReportRange, type VisitorsReportResponse } from "@/lib/admin-visitors-report";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "OWNER", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let range;
  try {
    range = parseVisitorsReportRange(req.nextUrl.searchParams);
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const [sessions, pageVisits] = await Promise.all([
    prisma.visitorSession.findMany({
      where: {
        startedAt: { gte: range.from, lt: range.to },
      },
      select: {
        id: true,
        visitorKey: true,
        startedAt: true,
        lastSeenAt: true,
        isNewVisitor: true,
        country: true,
        region: true,
      },
    }),
    prisma.pageVisit.findMany({
      where: {
        visitedAt: { gte: range.from, lt: range.to },
      },
      select: {
        path: true,
        visitedAt: true,
        durationSeconds: true,
        visitorSessionId: true,
      },
    }),
  ]);

  const payload: VisitorsReportResponse = buildVisitorsReportResponse(range, sessions, pageVisits);
  return NextResponse.json(payload);
}
