import { BookingStatus, PaymentStatus, type Blockout, type Booking, type Payment, type WorkingHours } from "@prisma/client";

export type BookingWithPayments = Pick<Booking, "id" | "startAt" | "endAt" | "status" | "clientId"> & {
  payments: Pick<Payment, "amountCents" | "status" | "capturedAt">[];
};

export type Range = { start: Date; end: Date };

export type AdminPeriodMetrics = {
  bookingCount: number;
  revenueCents: number;
  depositRevenueCents: number;
  completedRevenueCents: number;
  cancelledCount: number;
  noShowCount: number;
  utilizedMinutes: number;
  capacityMinutes: number;
  utilizationRate: number;
};

const OCCUPIED_STATUSES: BookingStatus[] = ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED"];
const CANCELLED_STATUSES: BookingStatus[] = ["CANCELLED_BY_ADMIN", "CANCELLED_BY_CLIENT"];

export function getPeriodRanges(now: Date) {
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const weekStart = new Date(todayStart);
  const dayOfWeek = weekStart.getUTCDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - diffToMonday);

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  return {
    today: { start: todayStart, end: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) },
    week: { start: weekStart, end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) },
    month: {
      start: monthStart,
      end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
    },
  };
}

function overlapMinutes(a: Range, b: Range) {
  const start = Math.max(a.start.getTime(), b.start.getTime());
  const end = Math.min(a.end.getTime(), b.end.getTime());
  return Math.max(0, Math.floor((end - start) / 60000));
}

function availabilityMinutesForRange(range: Range, workingHours: Pick<WorkingHours, "weekday" | "startTime" | "endTime" | "isClosed">[], blockouts: Pick<Blockout, "startAt" | "endAt">[]) {
  let cursor = new Date(range.start);
  let total = 0;

  while (cursor < range.end) {
    const dayStart = new Date(cursor);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayRange = { start: dayStart, end: dayEnd };

    const row = workingHours.find((w) => w.weekday === dayStart.getUTCDay());
    if (row && !row.isClosed) {
      const [sH, sM] = row.startTime.split(":").map(Number);
      const [eH, eM] = row.endTime.split(":").map(Number);
      const workStart = new Date(dayStart);
      workStart.setUTCHours(sH, sM, 0, 0);
      const workEnd = new Date(dayStart);
      workEnd.setUTCHours(eH, eM, 0, 0);
      const effectiveWorkRange = { start: workStart, end: workEnd };
      let dayMinutes = overlapMinutes(effectiveWorkRange, range);

      for (const blockout of blockouts) {
        dayMinutes -= overlapMinutes(
          { start: blockout.startAt, end: blockout.endAt },
          {
            start: new Date(Math.max(workStart.getTime(), range.start.getTime())),
            end: new Date(Math.min(workEnd.getTime(), range.end.getTime())),
          },
        );
      }
      total += Math.max(0, dayMinutes);
    }

    cursor = dayRange.end;
  }

  return total;
}

function bookingInRange(booking: Pick<Booking, "startAt">, range: Range) {
  return booking.startAt >= range.start && booking.startAt < range.end;
}

export function calculatePeriodMetrics(
  bookings: BookingWithPayments[],
  blockouts: Pick<Blockout, "startAt" | "endAt">[],
  workingHours: Pick<WorkingHours, "weekday" | "startTime" | "endTime" | "isClosed">[],
  range: Range,
): AdminPeriodMetrics {
  const rangeBookings = bookings.filter((b) => bookingInRange(b, range));
  let revenueCents = 0;
  let depositRevenueCents = 0;
  let completedRevenueCents = 0;
  let utilizedMinutes = 0;

  for (const booking of rangeBookings) {
    if (OCCUPIED_STATUSES.includes(booking.status)) {
      utilizedMinutes += Math.max(0, (booking.endAt.getTime() - booking.startAt.getTime()) / 60000);
    }

    const successfulPayments = booking.payments.filter(
      (payment) => payment.status === PaymentStatus.SUCCEEDED && payment.capturedAt !== null,
    );

    for (const payment of successfulPayments) {
      revenueCents += payment.amountCents;
      if (booking.status === BookingStatus.COMPLETED) completedRevenueCents += payment.amountCents;
      else depositRevenueCents += payment.amountCents;
    }
  }

  const capacityMinutes = availabilityMinutesForRange(range, workingHours, blockouts);

  return {
    bookingCount: rangeBookings.length,
    revenueCents,
    depositRevenueCents,
    completedRevenueCents,
    cancelledCount: rangeBookings.filter((b) => CANCELLED_STATUSES.includes(b.status)).length,
    noShowCount: rangeBookings.filter((b) => b.status === BookingStatus.NO_SHOW).length,
    utilizedMinutes,
    capacityMinutes,
    utilizationRate: capacityMinutes > 0 ? Number((utilizedMinutes / capacityMinutes).toFixed(4)) : 0,
  };
}

export function calculateClientMetrics(bookings: BookingWithPayments[], range: Range) {
  const rangeBookings = bookings.filter((b) => bookingInRange(b, range));
  const totalClients = new Set(rangeBookings.map((b) => b.clientId)).size;
  const completedClients = new Set(rangeBookings.filter((b) => b.status === "COMPLETED").map((b) => b.clientId)).size;
  const cancelledClients = new Set(rangeBookings.filter((b) => CANCELLED_STATUSES.includes(b.status)).map((b) => b.clientId)).size;

  return {
    totalClients,
    completedClients,
    cancelledClients,
    totalBookings: rangeBookings.length,
  };
}
