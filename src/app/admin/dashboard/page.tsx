import { calculatePeriodMetrics, getPeriodRanges } from "@/lib/admin-metrics";
import { prisma } from "@/lib/prisma";

function money(cents: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(cents / 100);
}

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shortDayLabel(key: string) {
  return new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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

  const earningsByDay = new Map<string, number>();
  for (const booking of bookings) {
    const key = dayKey(booking.startAt);
    earningsByDay.set(key, (earningsByDay.get(key) ?? 0) + booking.paidAmountCents);
  }

  const earningsSeries: { day: string; amountCents: number }[] = [];
  const cursor = new Date(ranges.month.start);
  while (cursor < ranges.month.end) {
    const key = dayKey(cursor);
    earningsSeries.push({ day: key, amountCents: earningsByDay.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const maxDailyEarnings = Math.max(...earningsSeries.map((point) => point.amountCents), 1);

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

      <section className="mt-6 rounded border border-slate-800 bg-slate-950 p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-white">Monthly earnings graph</h2>
        <p className="mb-4 text-xs text-slate-400">Daily totals for paid amounts in the current month.</p>

        <div className="flex h-52 items-end gap-1 overflow-x-auto pb-2">
          {earningsSeries.map((point) => {
            const heightPct = Math.max((point.amountCents / maxDailyEarnings) * 100, point.amountCents > 0 ? 3 : 0);

            return (
              <div key={point.day} className="flex min-w-8 flex-1 flex-col items-center justify-end gap-2">
                <div className="text-[10px] text-slate-400">{money(point.amountCents)}</div>
                <div className="w-full rounded-t bg-emerald-500/90" style={{ height: `${heightPct}%` }} title={`${shortDayLabel(point.day)}: ${money(point.amountCents)}`} />
                <div className="text-[10px] text-slate-400">{shortDayLabel(point.day)}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
