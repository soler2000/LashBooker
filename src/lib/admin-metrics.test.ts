import assert from "node:assert/strict";
import test from "node:test";

import { calculateClientMetrics, calculatePeriodMetrics, getPeriodRanges, type BookingWithPayments } from "@/lib/admin-metrics";

const now = new Date("2026-03-18T12:00:00.000Z");
const ranges = getPeriodRanges(now);

const bookings: BookingWithPayments[] = [
  {
    id: "b1",
    clientId: "c1",
    startAt: new Date("2026-03-18T09:00:00.000Z"),
    endAt: new Date("2026-03-18T10:00:00.000Z"),
    status: "COMPLETED",
    paidAmountCents: 7000,
    payments: [{ amountCents: 7000, status: "SUCCEEDED", capturedAt: new Date("2026-03-18T10:05:00.000Z") }],
  },
  {
    id: "b2",
    clientId: "c2",
    startAt: new Date("2026-03-18T11:00:00.000Z"),
    endAt: new Date("2026-03-18T12:30:00.000Z"),
    status: "CONFIRMED",
    paidAmountCents: 2100,
    payments: [{ amountCents: 2100, status: "SUCCEEDED", capturedAt: new Date("2026-03-16T08:00:00.000Z") }],
  },
  {
    id: "b3",
    clientId: "c3",
    startAt: new Date("2026-03-17T13:00:00.000Z"),
    endAt: new Date("2026-03-17T14:00:00.000Z"),
    status: "NO_SHOW",
    paidAmountCents: 6500,
    payments: [],
  },
  {
    id: "b4",
    clientId: "c4",
    startAt: new Date("2026-03-20T13:00:00.000Z"),
    endAt: new Date("2026-03-20T14:00:00.000Z"),
    status: "CANCELLED_BY_CLIENT",
    paidAmountCents: 0,
    payments: [],
  },
  {
    id: "b5",
    clientId: "c1",
    startAt: new Date("2026-03-25T14:00:00.000Z"),
    endAt: new Date("2026-03-25T15:00:00.000Z"),
    status: "PENDING_PAYMENT",
    paidAmountCents: 0,
    payments: [{ amountCents: 1500, status: "REQUIRES_PAYMENT_METHOD", capturedAt: null }],
  },
];

const workingHours = [
  { weekday: 1, startTime: "09:00", endTime: "17:00", isClosed: false },
  { weekday: 2, startTime: "09:00", endTime: "17:00", isClosed: false },
  { weekday: 3, startTime: "09:00", endTime: "17:00", isClosed: false },
  { weekday: 4, startTime: "09:00", endTime: "17:00", isClosed: false },
  { weekday: 5, startTime: "09:00", endTime: "17:00", isClosed: false },
  { weekday: 6, startTime: "09:00", endTime: "13:00", isClosed: false },
  { weekday: 0, startTime: "00:00", endTime: "00:00", isClosed: true },
];

const blockouts = [
  { startAt: new Date("2026-03-18T15:00:00.000Z"), endAt: new Date("2026-03-18T16:00:00.000Z") },
  { startAt: new Date("2026-03-19T10:00:00.000Z"), endAt: new Date("2026-03-19T11:00:00.000Z") },
];

test("admin metrics snapshot stays stable for deterministic fixture", () => {
  const snapshot = {
    today: calculatePeriodMetrics(bookings, blockouts, workingHours, ranges.today),
    week: calculatePeriodMetrics(bookings, blockouts, workingHours, ranges.week),
    month: calculatePeriodMetrics(bookings, blockouts, workingHours, ranges.month),
    clientsWeek: calculateClientMetrics(bookings, ranges.week),
  };

  assert.deepEqual(snapshot, {
    today: {
      bookingCount: 2,
      revenueCents: 15600,
      depositRevenueCents: 8600,
      completedRevenueCents: 7000,
      cancelledCount: 0,
      noShowCount: 0,
      utilizedMinutes: 150,
      capacityMinutes: 420,
      utilizationRate: 0.3571,
    },
    week: {
      bookingCount: 4,
      revenueCents: 15600,
      depositRevenueCents: 8600,
      completedRevenueCents: 7000,
      cancelledCount: 1,
      noShowCount: 1,
      utilizedMinutes: 150,
      capacityMinutes: 2520,
      utilizationRate: 0.0595,
    },
    month: {
      bookingCount: 5,
      revenueCents: 15600,
      depositRevenueCents: 8600,
      completedRevenueCents: 7000,
      cancelledCount: 1,
      noShowCount: 1,
      utilizedMinutes: 210,
      capacityMinutes: 11400,
      utilizationRate: 0.0184,
    },
    clientsWeek: {
      totalClients: 4,
      completedClients: 1,
      cancelledClients: 1,
      totalBookings: 4,
    },
  });
});
