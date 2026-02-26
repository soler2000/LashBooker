"use client";

import { useEffect, useState } from "react";

type Service = { id: string; name: string; priceCents: number };
type Slot = { startAt: string; endAt: string };

function formatSlot(slot: Slot) {
  return `${new Date(slot.startAt).toLocaleString()} - ${new Date(slot.endAt).toLocaleTimeString()}`;
}

export default function BookPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [message, setMessage] = useState("");
  const [acceptPolicies, setAcceptPolicies] = useState(false);
  const selectedSlotDetails = slots.find((slot) => slot.startAt === selectedSlot);

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
    setSelectedSlot((current) => (data.some((slot) => slot.startAt === current) ? current : ""));
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
          <li
            key={slot.startAt}
            className={`flex items-center justify-between rounded border p-3 text-sm text-gray-900 ${
              selectedSlot === slot.startAt ? "border-black bg-gray-100" : "border-gray-300 bg-white"
            }`}
          >
            <span>{formatSlot(slot)}</span>
            <button
              className={`rounded px-2 py-1 ${
                selectedSlot === slot.startAt ? "bg-black text-white" : "border border-gray-400 bg-white text-gray-900"
              }`}
              aria-pressed={selectedSlot === slot.startAt}
              onClick={() => setSelectedSlot(slot.startAt)}
            >
              {selectedSlot === slot.startAt ? "Selected" : "Select"}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded bg-white p-4 shadow">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={acceptPolicies}
            onChange={(e) => setAcceptPolicies(e.target.checked)}
          />
          <span>
            I have read and agree to the studio policies.
          </span>
        </label>
        <p className="mt-2 text-xs text-gray-600">You must accept policies before submitting your booking.</p>
        <p className="mt-2 text-sm text-gray-900">Selected slot: {selectedSlotDetails ? formatSlot(selectedSlotDetails) : "None"}</p>
        <button
          className="mt-2 rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={!serviceId || !selectedSlot || !acceptPolicies}
          onClick={async () => {
            const res = await fetch("/api/bookings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ serviceId, startAt: selectedSlot, policyAccepted: acceptPolicies }),
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
