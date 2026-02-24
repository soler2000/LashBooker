export async function sendBookingConfirmationEmail(to: string, bookingId: string) {
  // MVP: pluggable provider hook. For now, structured server log acts as fallback.
  console.log(JSON.stringify({ event: "booking_confirmation_email", to, bookingId }));
}
