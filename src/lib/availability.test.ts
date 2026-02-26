import assert from "node:assert/strict";
import test from "node:test";

import { getDayBoundsInTimezone, getWorkingWindowInTimezone, resolveTimeZone } from "@/lib/availability";

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
