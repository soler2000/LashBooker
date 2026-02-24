"use client";

import { useEffect, useState } from "react";

type Service = { id: string; name: string; priceCents: number };
type Slot = { startAt: string; endAt: string };

export default function BookPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/services")
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok || !Array.isArray(data)) {
          setMessage(typeof data?.error === "string" ? data.error : "Unable to load services right now.");
          setServices([]);
          return;
        }

        setServices(data);
      })
      .catch(() => {
        setMessage("Unable to load services right now.");
        setServices([]);
      });
  }, []);

  async function checkAvailability() {
    const res = await fetch(`/api/availability?serviceId=${serviceId}&date=${date}`);
    const data = await res.json();

    if (!res.ok || !Array.isArray(data)) {
      setSlots([]);
      setMessage(typeof data?.error === "string" ? data.error : "Unable to check availability right now.");
      return;
    }

    setSlots(data);
    setMessage("");
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-4 text-3xl font-bold">Book an appointment</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <select className="rounded border p-2" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          <option value="">Select service</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="date" className="rounded border p-2" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="rounded bg-black p-2 text-white" onClick={checkAvailability}>Check slots</button>
      </div>
      <ul className="mt-6 space-y-2">
        {slots.map((slot) => (
          <li key={slot.startAt} className="flex items-center justify-between rounded border bg-white p-3 text-sm">
            <span>{new Date(slot.startAt).toLocaleString()} - {new Date(slot.endAt).toLocaleTimeString()}</span>
            <button className="rounded border px-2 py-1" onClick={() => setSelectedSlot(slot.startAt)}>Select</button>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded bg-white p-4 shadow">
        <p className="text-sm">Selected slot: {selectedSlot || "None"}</p>
        <button
          className="mt-2 rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={!serviceId || !selectedSlot}
          onClick={async () => {
            const res = await fetch("/api/bookings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ serviceId, startAt: selectedSlot, policyAccepted: true }),
            });
            const data = await res.json();
            setMessage(res.ok ? `Booking ${data.bookingId} created. Complete payment using returned client secret.` : data.error || "Failed");
          }}
        >
          Create booking + payment intent
        </button>
        {message ? <p className="mt-2 text-sm">{message}</p> : null}
      </div>
    </main>
  );
}
