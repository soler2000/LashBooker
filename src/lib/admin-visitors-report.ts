import { z } from "zod";

export type VisitorsReportGranularity = "day" | "week" | "month";

export type VisitorsReportRange = {
  from: Date;
  to: Date;
  granularity: VisitorsReportGranularity;
};

export type VisitorsReportTopPage = {
  path: string;
  visits: number;
};

export type VisitorsReportLocation = {
  country: string;
  region: string;
  visitors: number;
};

export type VisitorsReportSeriesPoint = {
  periodStart: string;
  visitors: number;
  pageViews: number;
  avgSessionDurationSeconds: number;
};

export type VisitorsReportResponse = {
  uniqueVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  avgTimeOnSiteSeconds: number;
  topPages: VisitorsReportTopPage[];
  locationBreakdown: VisitorsReportLocation[];
  series: VisitorsReportSeriesPoint[];
  from: string;
  to: string;
  granularity: VisitorsReportGranularity;
};

export type VisitorSessionInput = {
  id: string;
  visitorKey: string;
  startedAt: Date;
  lastSeenAt: Date;
  isNewVisitor: boolean;
  country: string | null;
  region: string | null;
};

export type PageVisitInput = {
  path: string;
  visitedAt: Date;
  durationSeconds: number | null;
  visitorSessionId: string;
};

const paramsSchema = z.object({
  from: z.string().datetime({ offset: true }),
  to: z.string().datetime({ offset: true }),
  granularity: z.enum(["day", "week", "month"]).optional().default("day"),
});

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfWeek(date: Date) {
  const dayStart = startOfDay(date);
  const day = dayStart.getUTCDay();
  const diff = (day + 6) % 7;
  return new Date(dayStart.getTime() - diff * DAY_MS);
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addBucket(date: Date, granularity: VisitorsReportGranularity) {
  if (granularity === "day") return new Date(date.getTime() + DAY_MS);
  if (granularity === "week") return new Date(date.getTime() + 7 * DAY_MS);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

function bucketStart(date: Date, granularity: VisitorsReportGranularity) {
  if (granularity === "day") return startOfDay(date);
  if (granularity === "week") return startOfWeek(date);
  return startOfMonth(date);
}

export function parseVisitorsReportRange(searchParams: URLSearchParams): VisitorsReportRange {
  const parsed = paramsSchema.safeParse({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    granularity: searchParams.get("granularity") ?? undefined,
  });

  if (!parsed.success) {
    throw new Error("Invalid date range parameters");
  }

  const from = new Date(parsed.data.from);
  const to = new Date(parsed.data.to);
  if (from >= to) {
    throw new Error("from must be before to");
  }

  return { from, to, granularity: parsed.data.granularity };
}

export function buildVisitorsReportResponse(
  range: VisitorsReportRange,
  sessions: VisitorSessionInput[],
  pageVisits: PageVisitInput[],
): VisitorsReportResponse {
  const uniqueVisitorSet = new Set(sessions.map((session) => session.visitorKey));

  const newVisitorSet = new Set(
    sessions.filter((session) => session.isNewVisitor && session.startedAt >= range.from && session.startedAt < range.to).map((s) => s.visitorKey),
  );

  const returningVisitorSet = new Set(
    sessions
      .filter((session) => !newVisitorSet.has(session.visitorKey))
      .map((session) => session.visitorKey),
  );

  const avgTimeOnSiteSeconds =
    sessions.length === 0
      ? 0
      : Math.round(
          sessions.reduce((sum, session) => sum + Math.max(0, (session.lastSeenAt.getTime() - session.startedAt.getTime()) / 1000), 0) /
            sessions.length,
        );

  const pageCounts = new Map<string, number>();
  for (const visit of pageVisits) {
    pageCounts.set(visit.path, (pageCounts.get(visit.path) ?? 0) + 1);
  }

  const topPages = [...pageCounts.entries()]
    .map(([path, visits]) => ({ path, visits }))
    .sort((a, b) => b.visits - a.visits || a.path.localeCompare(b.path))
    .slice(0, 10);

  const locationVisitorMap = new Map<string, Set<string>>();
  for (const session of sessions) {
    const country = session.country ?? "Unknown";
    const region = session.region ?? "Unknown";
    const key = `${country}:::${region}`;
    if (!locationVisitorMap.has(key)) {
      locationVisitorMap.set(key, new Set());
    }
    locationVisitorMap.get(key)?.add(session.visitorKey);
  }

  const locationBreakdown = [...locationVisitorMap.entries()]
    .map(([key, visitors]) => {
      const [country, region] = key.split(":::");
      return { country, region, visitors: visitors.size };
    })
    .sort((a, b) => b.visitors - a.visitors || a.country.localeCompare(b.country) || a.region.localeCompare(b.region));

  const bucketMap = new Map<
    string,
    {
      visitors: Set<string>;
      pageViews: number;
      sessionDurationTotal: number;
      sessionCount: number;
    }
  >();

  const start = bucketStart(range.from, range.granularity);
  for (let cursor = start; cursor < range.to; cursor = addBucket(cursor, range.granularity)) {
    bucketMap.set(cursor.toISOString(), {
      visitors: new Set(),
      pageViews: 0,
      sessionDurationTotal: 0,
      sessionCount: 0,
    });
  }

  for (const session of sessions) {
    const key = bucketStart(session.startedAt, range.granularity).toISOString();
    const bucket = bucketMap.get(key);
    if (!bucket) continue;
    bucket.visitors.add(session.visitorKey);
    bucket.sessionDurationTotal += Math.max(0, (session.lastSeenAt.getTime() - session.startedAt.getTime()) / 1000);
    bucket.sessionCount += 1;
  }

  for (const visit of pageVisits) {
    const key = bucketStart(visit.visitedAt, range.granularity).toISOString();
    const bucket = bucketMap.get(key);
    if (!bucket) continue;
    bucket.pageViews += 1;
  }

  const series = [...bucketMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([periodStart, value]) => ({
      periodStart,
      visitors: value.visitors.size,
      pageViews: value.pageViews,
      avgSessionDurationSeconds:
        value.sessionCount === 0 ? 0 : Math.round(value.sessionDurationTotal / value.sessionCount),
    }));

  return {
    uniqueVisitors: uniqueVisitorSet.size,
    newVisitors: newVisitorSet.size,
    returningVisitors: returningVisitorSet.size,
    avgTimeOnSiteSeconds,
    topPages,
    locationBreakdown,
    series,
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    granularity: range.granularity,
  };
}
