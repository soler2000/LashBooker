import type { Booking, BookingStatus } from "@prisma/client";

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED"];

export function canManageClientBookingStatus(status: BookingStatus) {
  return ACTIVE_BOOKING_STATUSES.includes(status);
}

export function computeHoursUntil(startAt: Date, now: Date = new Date()) {
  return (startAt.getTime() - now.getTime()) / (1000 * 60 * 60);
}

export function isWithinCutoffWindow(startAt: Date, cutoffHours: number, now: Date = new Date()) {
  return computeHoursUntil(startAt, now) < cutoffHours;
}

export function bookingWindow(booking: Pick<Booking, "startAt" | "endAt">, beforeMinutes = 0, afterMinutes = 0) {
  const start = new Date(booking.startAt.getTime() - beforeMinutes * 60_000);
  const end = new Date(booking.endAt.getTime() + afterMinutes * 60_000);
  return { start, end };
}

