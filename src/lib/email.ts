import crypto from "node:crypto";

export type DeliveryResult = {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
};

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  metadata?: Record<string, string>;
};

export type ProviderWebhookEvent = {
  messageId?: string;
  event: "OPENED" | "CLICKED";
};

export async function sendEmail(input: SendEmailInput): Promise<DeliveryResult> {
  const provider = (process.env.EMAIL_PROVIDER || "LOG").toUpperCase();

  if (provider === "LOG") {
    const providerMessageId = `log_${crypto.randomUUID()}`;
    console.log(JSON.stringify({ event: "email_send", provider, ...input, providerMessageId }));
    return { ok: true, providerMessageId };
  }

  // Placeholder for provider integrations (SES, Postmark, Resend, etc.)
  console.warn(`Unsupported EMAIL_PROVIDER '${provider}', defaulting to log transport.`);
  const providerMessageId = `fallback_${crypto.randomUUID()}`;
  console.log(JSON.stringify({ event: "email_send", provider: "LOG", ...input, providerMessageId }));
  return { ok: true, providerMessageId };
}

export function parseProviderWebhook(payload: unknown): ProviderWebhookEvent | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  const eventRaw = typeof body.event === "string" ? body.event.toUpperCase() : "";
  const messageId = typeof body.messageId === "string" ? body.messageId : undefined;

  if (eventRaw === "OPENED") return { messageId, event: "OPENED" };
  if (eventRaw === "CLICKED") return { messageId, event: "CLICKED" };
  return null;
}

export async function sendBookingConfirmationEmail(to: string, bookingId: string) {
  await sendEmail({
    to,
    subject: "Your booking is confirmed",
    html: `<p>Your booking <strong>${bookingId}</strong> is confirmed.</p>`,
    text: `Your booking ${bookingId} is confirmed.`,
    metadata: { bookingId, type: "booking_confirmation" },
  });
}

export async function sendBookingReminderEmail(
  to: string,
  bookingId: string,
  scheduledHours: number,
) {
  await sendEmail({
    to,
    subject: "Booking reminder",
    html: `<p>Reminder: your booking <strong>${bookingId}</strong> is in ${scheduledHours} hours.</p>`,
    text: `Reminder: your booking ${bookingId} is in ${scheduledHours} hours.`,
    metadata: { bookingId, scheduledHours: String(scheduledHours), type: "booking_reminder" },
  });
}
