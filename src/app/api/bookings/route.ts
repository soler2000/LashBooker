import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDepositAmount, stripe } from "@/lib/payments";

const bodySchema = z.object({
  serviceId: z.string().uuid(),
  startAt: z.string().datetime(),
  policyAccepted: z.boolean().refine((v) => v),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const service = await prisma.service.findUnique({ where: { id: parsed.data.serviceId } });
  if (!service) return NextResponse.json({ error: "Service missing" }, { status: 404 });

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(startAt.getTime() + service.durationMinutes * 60000);

  const overlaps = await prisma.booking.findFirst({
    where: {
      status: { in: ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED"] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
  if (overlaps) return NextResponse.json({ error: "Slot no longer available" }, { status: 409 });

  const booking = await prisma.booking.create({
    data: {
      clientId: session.user.id,
      serviceId: service.id,
      startAt,
      endAt,
      policyAcceptedAt: new Date(),
      status: "PENDING_PAYMENT",
    },
  });

  const amount = calculateDepositAmount(service.priceCents, service.depositType, service.depositValue);
  const intent = await stripe.paymentIntents.create({
    amount,
    currency: "gbp",
    metadata: { bookingId: booking.id, clientId: session.user.id, serviceId: service.id },
    automatic_payment_methods: { enabled: true },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: "STRIPE",
      providerPaymentIntentId: intent.id,
      amountCents: amount,
      currency: "gbp",
      status: "REQUIRES_PAYMENT_METHOD",
    },
  });

  return NextResponse.json({ bookingId: booking.id, clientSecret: intent.client_secret });
}
