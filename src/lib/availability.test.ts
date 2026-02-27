import assert from "node:assert/strict";
import test from "node:test";

import { getDayBoundsInTimezone, getWeeklyAvailableSlots, getWorkingWindowInTimezone, resolveTimeZone } from "@/lib/availability";

test("falls back to UTC when timezone is invalid", () => {
  assert.equal(resolveTimeZone("America/New_York"), "America/New_York");
  assert.equal(resolveTimeZone("Invalid/Zone"), "UTC");
  assert.equal(resolveTimeZone(""), "UTC");
});

test("computes normal-date working window in business timezone and returns UTC ISO values", () => {
  const { dayStart, dayEnd } = getWorkingWindowInTimezone("2026-02-10", "09:00", "17:00", "America/New_York");

  assert.equal(dayStart.toISOString(), "2026-02-10T14:00:00.000Z");
  assert.equal(dayEnd.toISOString(), "2026-02-10T22:00:00.000Z");
});

test("handles DST spring-forward date with correct local-day boundaries", () => {
  const { dayStart, dayEnd } = getDayBoundsInTimezone("2026-03-08", "America/New_York");

  assert.equal(dayStart.toISOString(), "2026-03-08T05:00:00.000Z");
  assert.equal(dayEnd.toISOString(), "2026-03-09T04:00:00.000Z");
  assert.equal(dayEnd.getTime() - dayStart.getTime(), 23 * 60 * 60 * 1000);

  const workingWindow = getWorkingWindowInTimezone("2026-03-08", "09:00", "17:00", "America/New_York");
  assert.equal(workingWindow.dayStart.toISOString(), "2026-03-08T13:00:00.000Z");
  assert.equal(workingWindow.dayEnd.toISOString(), "2026-03-08T21:00:00.000Z");
});

test("weekly aggregation returns 7 day buckets", async () => {
  const requestedDates: string[] = [];

  const days = await getWeeklyAvailableSlots("service-1", "2026-02-09", 7, async (_serviceId, date) => {
    requestedDates.push(date);
    return [{ startAt: `${date}T10:00:00.000Z`, endAt: `${date}T11:00:00.000Z` }];
  });

  assert.equal(days.length, 7);
  assert.deepEqual(requestedDates, ["2026-02-09", "2026-02-10", "2026-02-11", "2026-02-12", "2026-02-13", "2026-02-14", "2026-02-15"]);
  assert.equal(days[0]?.slots[0]?.startAt, "2026-02-09T10:00:00.000Z");
  assert.equal(days[6]?.slots[0]?.startAt, "2026-02-15T10:00:00.000Z");
});

test("closed or non-working days can return empty slot arrays", async () => {
  const days = await getWeeklyAvailableSlots("service-1", "2026-02-09", 3, async (_serviceId, date) => {
    if (date === "2026-02-10") return [];
    return [{ startAt: `${date}T12:00:00.000Z`, endAt: `${date}T13:00:00.000Z` }];
  });

  assert.deepEqual(days, [
    { date: "2026-02-09", slots: [{ startAt: "2026-02-09T12:00:00.000Z", endAt: "2026-02-09T13:00:00.000Z" }] },
    { date: "2026-02-10", slots: [] },
    { date: "2026-02-11", slots: [{ startAt: "2026-02-11T12:00:00.000Z", endAt: "2026-02-11T13:00:00.000Z" }] },
  ]);
});

test("single-date behavior remains available via one-day weekly request", async () => {
  const days = await getWeeklyAvailableSlots("service-1", "2026-02-09", 1, async () => {
    return [{ startAt: "2026-02-09T09:00:00.000Z", endAt: "2026-02-09T10:00:00.000Z" }];
  });

  assert.equal(days.length, 1);
  assert.equal(days[0]?.date, "2026-02-09");
  assert.equal(days[0]?.slots[0]?.startAt, "2026-02-09T09:00:00.000Z");
});
