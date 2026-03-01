import { calculatePeriodMetrics, getPeriodRanges } from "@/lib/admin-metrics";
import { prisma } from "@/lib/prisma";

function money(cents: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(cents / 100);
}

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const now = new Date();
  const ranges = getPeriodRanges(now);
  const dataWindowStart = new Date(Math.min(ranges.today.start.getTime(), ranges.week.start.getTime(), ranges.month.start.getTime()));
  const dataWindowEnd = new Date(Math.max(ranges.today.end.getTime(), ranges.week.end.getTime(), ranges.month.end.getTime()));

  const [bookings, blockouts, workingHours] = await Promise.all([
    prisma.booking.findMany({
      where: { startAt: { gte: dataWindowStart, lt: dataWindowEnd } },
      select: { id: true, startAt: true, endAt: true, status: true, clientId: true, paidAmountCents: true, payments: true },
    }),
    prisma.blockout.findMany({
      where: { endAt: { gt: dataWindowStart }, startAt: { lt: dataWindowEnd } },
      select: { startAt: true, endAt: true },
    }),
    prisma.workingHours.findMany({
      select: { weekday: true, startTime: true, endTime: true, isClosed: true },
    }),
  ]);

  const metrics = {
    today: calculatePeriodMetrics(bookings, blockouts, workingHours, ranges.today),
    week: calculatePeriodMetrics(bookings, blockouts, workingHours, ranges.week),
    month: calculatePeriodMetrics(bookings, blockouts, workingHours, ranges.month),
  };

  const cards = [
    ["Today", metrics.today],
    ["Week", metrics.week],
    ["Month", metrics.month],
  ] as const;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-white">Dashboard</h1>
      <p className="mb-6 text-sm text-slate-300">As of {now.toLocaleString()}</p>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(([label, data]) => (
          <section key={label} className="rounded border border-slate-800 bg-slate-950 p-4 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-white">{label}</h2>
            <dl className="space-y-1 text-sm text-slate-200">
              <div className="flex justify-between"><dt>Bookings</dt><dd>{data.bookingCount}</dd></div>
              <div className="flex justify-between"><dt>Total revenue</dt><dd>{money(data.revenueCents)}</dd></div>
              <div className="flex justify-between"><dt>Deposits</dt><dd>{money(data.depositRevenueCents)}</dd></div>
              <div className="flex justify-between"><dt>Completed</dt><dd>{money(data.completedRevenueCents)}</dd></div>
              <div className="flex justify-between"><dt>Cancellations</dt><dd>{data.cancelledCount}</dd></div>
              <div className="flex justify-between"><dt>No-shows</dt><dd>{data.noShowCount}</dd></div>
              <div className="flex justify-between"><dt>Utilization</dt><dd>{pct(data.utilizationRate)}</dd></div>
              <div className="flex justify-between"><dt>Used / Capacity</dt><dd>{data.utilizedMinutes} / {data.capacityMinutes} min</dd></div>
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
