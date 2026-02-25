import type { BookingStatus } from "@prisma/client";
import { bookingWindow } from "@/lib/portal-bookings";

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED"];

export type BookingWithServiceBuffers = {
  startAt: Date;
  endAt: Date;
  service: {
    bufferBeforeMinutes: number;
    bufferAfterMinutes: number;
  };
};

export function hasBookingWindowConflict(
  requestedWindow: { start: Date; end: Date },
  existingBookings: BookingWithServiceBuffers[],
) {
  return existingBookings.some((booking) => {
    const existingWindow = bookingWindow(
      booking,
      booking.service.bufferBeforeMinutes,
      booking.service.bufferAfterMinutes,
    );

    return requestedWindow.start < existingWindow.end && requestedWindow.end > existingWindow.start;
  });
}
