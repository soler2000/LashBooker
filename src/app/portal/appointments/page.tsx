"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BookingItem = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  service: {
    name: string;
  };
};

type BookingResponse = {
  upcoming: BookingItem[];
  past: BookingItem[];
};

export default function PortalAppointmentsPage() {
  const [data, setData] = useState<BookingResponse>({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadBookings = async () => {
    setLoading(true);
    const res = await fetch("/api/portal/bookings", { cache: "no-store" });
    const payload = await res.json();
    if (!res.ok) {
      setMessage(payload.error ?? "Unable to load bookings");
      setLoading(false);
      return;
    }

    setData(payload);
    setLoading(false);
  };

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Your appointments</h1>
        <p className="mt-2 text-sm text-slate-600">Manage upcoming bookings and review your appointment history.</p>
      </header>

      {message ? <p className="rounded border bg-white p-3 text-sm">{message}</p> : null}

      <div className="rounded border bg-white p-4">
        <h2 className="mb-4 text-lg font-medium">Upcoming</h2>
        {loading ? <p className="text-sm text-slate-600">Loading…</p> : null}
        {!loading && data.upcoming.length === 0 ? <p className="text-sm text-slate-600">No upcoming appointments.</p> : null}
        <ul className="space-y-3">
          {data.upcoming.map((booking) => (
            <li key={booking.id} className="rounded border p-3">
              <p className="font-medium">{booking.service.name} · {booking.status}</p>
              <p className="text-sm text-slate-600">{new Date(booking.startAt).toLocaleString()} - {new Date(booking.endAt).toLocaleTimeString()}</p>
              <Link href={`/portal/appointments/${booking.id}`} className="mt-3 inline-block rounded border px-3 py-1 text-sm hover:bg-slate-50">
                View details
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="mb-4 text-lg font-medium">Past</h2>
        {!loading && data.past.length === 0 ? <p className="text-sm text-slate-600">No past appointments yet.</p> : null}
        <ul className="space-y-3">
          {data.past.map((booking) => (
            <li key={booking.id} className="rounded border p-3">
              <p className="font-medium">{booking.service.name} · {booking.status}</p>
              <p className="text-sm text-slate-600">{new Date(booking.startAt).toLocaleString()} - {new Date(booking.endAt).toLocaleTimeString()}</p>
              <Link href={`/portal/appointments/${booking.id}`} className="mt-3 inline-block rounded border px-3 py-1 text-sm hover:bg-slate-50">
                View details
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
