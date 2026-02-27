import assert from "node:assert/strict";
import test from "node:test";

import { buildVisitorsReportResponse, parseVisitorsReportRange } from "@/lib/admin-visitors-report";

test("parseVisitorsReportRange validates and defaults granularity", () => {
  const range = parseVisitorsReportRange(
    new URLSearchParams({
      from: "2026-04-01T00:00:00.000Z",
      to: "2026-04-10T00:00:00.000Z",
    }),
  );

  assert.equal(range.granularity, "day");
  assert.equal(range.from.toISOString(), "2026-04-01T00:00:00.000Z");
  assert.equal(range.to.toISOString(), "2026-04-10T00:00:00.000Z");

  assert.throws(() => parseVisitorsReportRange(new URLSearchParams({ from: "2026-04-10T00:00:00.000Z", to: "2026-04-01T00:00:00.000Z" })));
});

test("buildVisitorsReportResponse remains stable for deterministic fixture", () => {
  const report = buildVisitorsReportResponse(
    {
      from: new Date("2026-04-01T00:00:00.000Z"),
      to: new Date("2026-04-04T00:00:00.000Z"),
      granularity: "day",
    },
    [
      {
        id: "s1",
        visitorKey: "visitor-a",
        startedAt: new Date("2026-04-01T09:00:00.000Z"),
        lastSeenAt: new Date("2026-04-01T09:15:00.000Z"),
        isNewVisitor: true,
        country: "US",
        region: "CA",
      },
      {
        id: "s2",
        visitorKey: "visitor-b",
        startedAt: new Date("2026-04-01T10:00:00.000Z"),
        lastSeenAt: new Date("2026-04-01T10:10:00.000Z"),
        isNewVisitor: true,
        country: "US",
        region: "NY",
      },
      {
        id: "s3",
        visitorKey: "visitor-a",
        startedAt: new Date("2026-04-03T12:00:00.000Z"),
        lastSeenAt: new Date("2026-04-03T12:20:00.000Z"),
        isNewVisitor: false,
        country: "US",
        region: "CA",
      },
    ],
    [
      { path: "/", visitedAt: new Date("2026-04-01T09:00:00.000Z"), durationSeconds: 120, visitorSessionId: "s1" },
      { path: "/pricing", visitedAt: new Date("2026-04-01T09:05:00.000Z"), durationSeconds: 30, visitorSessionId: "s1" },
      { path: "/", visitedAt: new Date("2026-04-01T10:01:00.000Z"), durationSeconds: 45, visitorSessionId: "s2" },
      { path: "/", visitedAt: new Date("2026-04-03T12:01:00.000Z"), durationSeconds: 70, visitorSessionId: "s3" },
      { path: "/about", visitedAt: new Date("2026-04-03T12:08:00.000Z"), durationSeconds: 60, visitorSessionId: "s3" },
    ],
  );

  assert.deepEqual(report, {
    uniqueVisitors: 2,
    newVisitors: 2,
    returningVisitors: 0,
    avgTimeOnSiteSeconds: 900,
    topPages: [
      { path: "/", visits: 3 },
      { path: "/about", visits: 1 },
      { path: "/pricing", visits: 1 },
    ],
    locationBreakdown: [
      { country: "US", region: "CA", visitors: 1 },
      { country: "US", region: "NY", visitors: 1 },
    ],
    series: [
      { periodStart: "2026-04-01T00:00:00.000Z", visitors: 2, pageViews: 3, avgSessionDurationSeconds: 750 },
      { periodStart: "2026-04-02T00:00:00.000Z", visitors: 0, pageViews: 0, avgSessionDurationSeconds: 0 },
      { periodStart: "2026-04-03T00:00:00.000Z", visitors: 1, pageViews: 2, avgSessionDurationSeconds: 1200 },
    ],
    from: "2026-04-01T00:00:00.000Z",
    to: "2026-04-04T00:00:00.000Z",
    granularity: "day",
  });
});
