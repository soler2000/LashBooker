import assert from "node:assert/strict";
import test from "node:test";

import { hasBookingWindowConflict } from "@/lib/booking-conflicts";
import { bookingWindow } from "@/lib/portal-bookings";

test("detects overlap when existing booking's buffer-after reaches into requested window", () => {
  const requestedWindow = bookingWindow(
    {
      startAt: new Date("2026-01-15T10:20:00.000Z"),
      endAt: new Date("2026-01-15T10:50:00.000Z"),
    },
    0,
    0,
  );

  const hasConflict = hasBookingWindowConflict(requestedWindow, [
    {
      startAt: new Date("2026-01-15T09:30:00.000Z"),
      endAt: new Date("2026-01-15T10:00:00.000Z"),
      serviceBufferBeforeMinutes: 0,
      serviceBufferAfterMinutes: 30,
    },
  ]);

  assert.equal(hasConflict, true);
});

test("detects overlap when requested booking buffer-before reaches into existing booking", () => {
  const requestedWindow = bookingWindow(
    {
      startAt: new Date("2026-01-15T11:00:00.000Z"),
      endAt: new Date("2026-01-15T11:30:00.000Z"),
    },
    20,
    0,
  );

  const hasConflict = hasBookingWindowConflict(requestedWindow, [
    {
      startAt: new Date("2026-01-15T10:20:00.000Z"),
      endAt: new Date("2026-01-15T10:50:00.000Z"),
      serviceBufferBeforeMinutes: 0,
      serviceBufferAfterMinutes: 0,
    },
  ]);

  assert.equal(hasConflict, true);
});

test("does not flag conflict when buffered windows only touch at boundary", () => {
  const requestedWindow = bookingWindow(
    {
      startAt: new Date("2026-01-15T10:30:00.000Z"),
      endAt: new Date("2026-01-15T11:00:00.000Z"),
    },
    0,
    0,
  );

  const hasConflict = hasBookingWindowConflict(requestedWindow, [
    {
      startAt: new Date("2026-01-15T09:30:00.000Z"),
      endAt: new Date("2026-01-15T10:00:00.000Z"),
      serviceBufferBeforeMinutes: 0,
      serviceBufferAfterMinutes: 30,
    },
  ]);

  assert.equal(hasConflict, false);
});
