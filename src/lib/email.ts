export async function sendBookingConfirmationEmail(to: string, bookingId: string) {
  // MVP: pluggable provider hook. For now, structured server log acts as fallback.
  console.log(JSON.stringify({ event: "booking_confirmation_email", to, bookingId }));
}

export async function sendBookingReminderEmail(
  to: string,
  bookingId: string,
  scheduledHours: number,
) {
  console.log(JSON.stringify({
    event: "booking_reminder_email",
    to,
    bookingId,
    scheduledHours,
  }));
}
