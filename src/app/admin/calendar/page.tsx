"use client";

import { useEffect, useMemo, useState } from "react";

type Booking = {
  id: string;
  startAt: string;
  endAt: string;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED_BY_CLIENT" | "CANCELLED_BY_ADMIN" | "NO_SHOW";
  notes: string | null;
  service: { name: string };
  client: { email: string };
};

type Blockout = { id: string; startAt: string; endAt: string; reason: string };

const statusOptions: Booking["status"][] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_ADMIN",
  "NO_SHOW",
];

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function AdminCalendarPage() {
  const [view, setView] = useState<"day" | "week">("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockouts, setBlockouts] = useState<Blockout[]>([]);

  const range = useMemo(() => {
    const dayStart = new Date(anchor);
    dayStart.setUTCHours(0, 0, 0, 0);

    if (view === "day") {
      return { startAt: dayStart, endAt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000) };
    }

    const weekStart = new Date(dayStart);
    const diffToMonday = (weekStart.getUTCDay() + 6) % 7;
    weekStart.setUTCDate(weekStart.getUTCDate() - diffToMonday);
    return { startAt: weekStart, endAt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) };
  }, [anchor, view]);

  async function load() {
    const params = new URLSearchParams({
      startAt: range.startAt.toISOString(),
      endAt: range.endAt.toISOString(),
    });
    const response = await fetch(`/api/admin/bookings?${params.toString()}`, { cache: "no-store" });
    const data = await response.json();
    setBookings(data.bookings ?? []);
    setBlockouts(data.blockouts ?? []);
  }

  useEffect(() => {
    load();
  }, [range.startAt, range.endAt]);

  const days = useMemo(() => {
    const list: Date[] = [];
    let cursor = new Date(range.startAt);
    while (cursor < range.endAt) {
      list.push(new Date(cursor));
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    }
    return list;
  }, [range]);

  async function updateStatus(bookingId: string, status: Booking["status"]) {
    await fetch("/api/admin/bookings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bookingId, status }),
    });
    await load();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Calendar</h1>
      <div className="mb-4 flex items-center gap-2">
        <button className="rounded border px-3 py-1" onClick={() => setView("day")}>Day</button>
        <button className="rounded border px-3 py-1" onClick={() => setView("week")}>Week</button>
        <button className="rounded border px-3 py-1" onClick={() => setAnchor(new Date(anchor.getTime() - (view === "day" ? 1 : 7) * 24 * 60 * 60 * 1000))}>Prev</button>
        <button className="rounded border px-3 py-1" onClick={() => setAnchor(new Date(anchor.getTime() + (view === "day" ? 1 : 7) * 24 * 60 * 60 * 1000))}>Next</button>
        <p className="ml-2 text-sm text-slate-500">{range.startAt.toISOString()} → {range.endAt.toISOString()}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {days.map((day) => {
          const dayKey = isoDay(day);
          const dayBookings = bookings.filter((booking) => isoDay(new Date(booking.startAt)) === dayKey);
          const dayBlockouts = blockouts.filter((blockout) => {
            const start = new Date(blockout.startAt);
            const end = new Date(blockout.endAt);
            return start < new Date(day.getTime() + 24 * 60 * 60 * 1000) && end > day;
          });

          return (
            <section key={dayKey} className="rounded border bg-white p-3">
              <h2 className="mb-2 font-semibold">{day.toUTCString().slice(0, 16)}</h2>

              <div className="space-y-2">
                {dayBlockouts.map((blockout) => (
                  <article key={blockout.id} className="rounded border border-amber-300 bg-amber-50 p-2 text-sm">
                    <p className="font-medium">Blockout: {blockout.reason}</p>
                    <p>{new Date(blockout.startAt).toLocaleTimeString()} - {new Date(blockout.endAt).toLocaleTimeString()}</p>
                  </article>
                ))}

                {dayBookings.map((booking) => (
                  <article key={booking.id} className="rounded border p-2 text-sm">
                    <p className="font-medium">{booking.service.name}</p>
                    <p>{new Date(booking.startAt).toLocaleTimeString()} - {new Date(booking.endAt).toLocaleTimeString()}</p>
                    <p className="text-slate-600">{booking.client.email}</p>
                    <select
                      className="mt-2 w-full rounded border px-2 py-1"
                      value={booking.status}
                      onChange={(event) => updateStatus(booking.id, event.target.value as Booking["status"])}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </article>
                ))}

                {dayBookings.length === 0 && dayBlockouts.length === 0 && (
                  <p className="text-sm text-slate-500">No bookings or blockouts</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
