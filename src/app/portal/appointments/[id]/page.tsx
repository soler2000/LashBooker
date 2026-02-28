import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDepositAmount } from "@/lib/payments";
import { canManageClientBookingStatus, isWithinCutoffWindow } from "@/lib/portal-bookings";
import { getJournalImageReadUrl } from "@/lib/journal-image-storage";
import AppointmentActions from "./AppointmentActions";

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatStatus(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}

export default async function PortalAppointmentDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/portal/appointments/${params.id}`)}`);
  }

  const [booking, settings] = await Promise.all([
    prisma.booking.findFirst({
      where: { id: params.id, clientId: session.user.id },
      include: {
        payments: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.businessSettings.findUnique({ where: { id: "default" } }),
  ]);

  if (!booking) notFound();

  const journalEntries = await prisma.journalEntry.findMany({
    where: { bookingId: booking.id, clientId: session.user.id },
    include: {
      images: { orderBy: { createdAt: "asc" } },
      createdBy: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const currency = settings?.currency ?? "GBP";
  const priceCents = booking.servicePriceCents;
  const depositDueCents = calculateDepositAmount(priceCents, booking.serviceDepositType, booking.serviceDepositValue);
  const remainingCents = Math.max(priceCents - depositDueCents, 0);
  const totalPaidCents = booking.payments
    .filter((payment) => payment.status === "SUCCEEDED")
    .reduce((sum, payment) => sum + payment.amountCents, 0);

  const canManage = canManageClientBookingStatus(booking.status);
  const cancelCutoffHours = settings?.cancelCutoffHours ?? 24;
  const rescheduleCutoffHours = settings?.rescheduleCutoffHours ?? 24;
  const isCancelWithinCutoff = isWithinCutoffWindow(booking.startAt, cancelCutoffHours);
  const isRescheduleWithinCutoff = isWithinCutoffWindow(booking.startAt, rescheduleCutoffHours);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <Link href="/portal/appointments" className="text-sm text-slate-600 hover:underline">← Back to appointments</Link>
        <h1 className="text-2xl font-semibold">Appointment details</h1>
        <p className="text-sm text-slate-600">Review service details, payment status, and manage this booking.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-3 rounded border bg-white p-4">
          <h2 className="text-lg font-medium">Service & timing</h2>
          <p><span className="font-medium">Service:</span> {booking.serviceName}</p>
          <p><span className="font-medium">Status:</span> <span className="capitalize">{formatStatus(booking.status)}</span></p>
          <p><span className="font-medium">Starts:</span> {booking.startAt.toLocaleString()}</p>
          <p><span className="font-medium">Ends:</span> {booking.endAt.toLocaleString()}</p>
          <p><span className="font-medium">Booked on:</span> {booking.createdAt.toLocaleString()}</p>
          <p><span className="font-medium">Policy accepted:</span> {booking.policyAcceptedAt.toLocaleString()}</p>
          {booking.notes ? <p><span className="font-medium">Notes:</span> {booking.notes}</p> : null}
        </section>

        <section className="space-y-3 rounded border bg-white p-4">
          <h2 className="text-lg font-medium">Payment summary</h2>
          <p><span className="font-medium">Service total:</span> {formatMoney(priceCents, currency)}</p>
          <p><span className="font-medium">Deposit due:</span> {formatMoney(depositDueCents, currency)}</p>
          <p><span className="font-medium">Remaining balance:</span> {formatMoney(remainingCents, currency)}</p>
          <p><span className="font-medium">Paid so far:</span> {formatMoney(totalPaidCents, currency)}</p>

          <div>
            <p className="mb-2 font-medium">Payment activity</p>
            {booking.payments.length === 0 ? (
              <p className="text-sm text-slate-600">No payment records yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {booking.payments.map((payment) => (
                  <li key={payment.id} className="rounded border p-2">
                    <p className="capitalize">{payment.status.toLowerCase().replaceAll("_", " ")} · {formatMoney(payment.amountCents, payment.currency)}</p>
                    <p className="text-slate-600">{payment.createdAt.toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="space-y-2 rounded border bg-white p-4">
        <h2 className="text-lg font-medium">Policy & cutoff windows</h2>
        <p className="text-sm text-slate-700">
          Cancellations are available until {cancelCutoffHours} hours before your appointment.
          {isCancelWithinCutoff ? " This appointment is currently inside that cancellation cutoff." : " You are currently outside the cancellation cutoff."}
        </p>
        <p className="text-sm text-slate-700">
          Rescheduling is available until {rescheduleCutoffHours} hours before your appointment.
          {isRescheduleWithinCutoff ? " This appointment is currently inside that reschedule cutoff." : " You are currently outside the reschedule cutoff."}
        </p>
      </section>

      <AppointmentActions bookingId={booking.id} canManage={canManage} />

      <section className="space-y-3 rounded border bg-white p-4">
        <h2 className="text-lg font-medium">Treatment journal</h2>
        {journalEntries.length === 0 ? <p className="text-sm text-slate-600">No journal entries have been published for this appointment yet.</p> : null}
        <ul className="space-y-4">
          {journalEntries.map((entry) => (
            <li key={entry.id} className="space-y-2 rounded border p-3">
              <p className="text-xs text-slate-600">{entry.createdAt.toLocaleString()} · Added by {entry.createdBy.email}</p>
              <p className="whitespace-pre-wrap text-sm text-slate-800">{entry.notes}</p>
              <div className="grid gap-2 md:grid-cols-3">
                {entry.images.map((image) => {
                  const readUrl = getJournalImageReadUrl(image.objectKey);
                  if (!readUrl) {
                    return <div key={image.id} className="flex h-36 items-center justify-center rounded bg-slate-100 text-xs text-slate-600">Image unavailable</div>;
                  }
                  return <img key={image.id} src={readUrl} alt="Treatment journal" className="h-36 w-full rounded object-cover" />;
                })}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
