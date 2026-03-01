import { PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { hasValidCronSecret } from "@/lib/cron-auth";

const CANCELLABLE_INTENT_STATUSES = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
  "requires_capture",
  "processing",
]);

function paymentStatusFromStripeStatus(status: string): PaymentStatus | null {
  if (status === "succeeded") return "SUCCEEDED";
  if (status === "canceled") return "CANCELED";
  if (status === "requires_payment_method") return "REQUIRES_PAYMENT_METHOD";
  return null;
}

export async function POST(req: Request) {
  if (!hasValidCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const expiryMinutes = settings?.pendingPaymentExpiryMinutes ?? 30;
  const cutoff = new Date(Date.now() - expiryMinutes * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "PENDING_PAYMENT",
      createdAt: { lt: cutoff },
    },
    include: {
      payments: {
        where: { provider: "STRIPE" },
      },
    },
  });

  const results: Array<{
    bookingId: string;
    canceledPaymentIntents: string[];
    failedPaymentIntentCancels: string[];
  }> = [];

  for (const booking of bookings) {
    const canceledPaymentIntents: string[] = [];
    const failedPaymentIntentCancels: string[] = [];

    for (const payment of booking.payments) {
      try {
        const intent = await stripe.paymentIntents.retrieve(payment.providerPaymentIntentId);

        if (CANCELLABLE_INTENT_STATUSES.has(intent.status)) {
          const canceledIntent = await stripe.paymentIntents.cancel(payment.providerPaymentIntentId);
          const canceledStatus = paymentStatusFromStripeStatus(canceledIntent.status);

          if (canceledStatus && canceledStatus !== payment.status) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: canceledStatus },
            });
          }

          canceledPaymentIntents.push(payment.providerPaymentIntentId);
          continue;
        }

        const mappedStatus = paymentStatusFromStripeStatus(intent.status);
        if (mappedStatus && mappedStatus !== payment.status) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: mappedStatus },
          });
        }
      } catch {
        failedPaymentIntentCancels.push(payment.providerPaymentIntentId);
      }
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED_BY_ADMIN" },
    });

    results.push({
      bookingId: booking.id,
      canceledPaymentIntents,
      failedPaymentIntentCancels,
    });
  }

  return NextResponse.json({
    expiryMinutes,
    cutoff,
    expiredCount: results.length,
    results,
  });
}
