import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmationEmail } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing webhook config" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    const payment = await prisma.payment.update({
      where: { providerPaymentIntentId: pi.id },
      data: { status: "SUCCEEDED", capturedAt: new Date() },
      include: { booking: { include: { client: true } } },
    });

    await prisma.booking.update({ where: { id: payment.bookingId }, data: { status: "CONFIRMED" } });
    await sendBookingConfirmationEmail(payment.booking.client.email, payment.bookingId);
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object;
    await prisma.payment.update({ where: { providerPaymentIntentId: pi.id }, data: { status: "FAILED" } });
  }

  return NextResponse.json({ received: true });
}
