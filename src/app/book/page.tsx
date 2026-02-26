"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Service = { id: string; name: string; description: string; priceCents: number };
type Slot = { startAt: string; endAt: string };

function formatSlot(slot: Slot) {
  return `${new Date(slot.startAt).toLocaleString()} - ${new Date(slot.endAt).toLocaleTimeString()}`;
}

export default function BookPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [message, setMessage] = useState("");
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [acceptPolicies, setAcceptPolicies] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const selectedService = services.find((service) => service.id === serviceId);
  const selectedSlotDetails = slots.find((slot) => slot.startAt === selectedSlot);
  const canCreateBooking = Boolean(serviceId && date && selectedSlot && acceptPolicies);

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
    if (!serviceId || !date) {
      setSlots([]);
      setSelectedSlot("");
      setMessage("Please select a service and date before checking availability.");
      return;
    }

    setIsCheckingSlots(true);

    try {
      const res = await fetch(`/api/availability?serviceId=${serviceId}&date=${date}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        setSlots([]);
        setMessage(typeof data?.error === "string" ? data.error : "Unable to check availability right now.");
        return;
      }

      setSlots(data);
      setSelectedSlot((current) => (data.some((slot) => slot.startAt === current) ? current : ""));
      setMessage(data.length ? "" : "No slots available for that date. Try another date.");
    } catch {
      setSlots([]);
      setSelectedSlot("");
      setMessage("Unable to check availability right now.");
    } finally {
      setIsCheckingSlots(false);
    }
  }

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat px-4 py-10"
      style={{ backgroundImage: "url(https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1800&q=80)" }}
    >
      <div className="mx-auto max-w-3xl rounded-xl bg-black/65 p-8 text-white shadow-2xl backdrop-blur-[2px]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Book an appointment</h1>
          <div className="flex gap-2">
            <Link href="/" className="rounded border border-white/60 px-3 py-2 text-sm font-medium hover:bg-white/20">
              Main menu
            </Link>
            <Link href="/login?redirectTo=%2Fbook" className="rounded border border-white/60 px-3 py-2 text-sm font-medium hover:bg-white/20">
              Sign in
            </Link>
            <Link href="/register?redirectTo=%2Fbook" className="rounded border border-white/60 px-3 py-2 text-sm font-medium hover:bg-white/20">
              Create account
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <select className="rounded border border-white/40 bg-white/90 p-2 text-gray-900" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          <option value="">Select service</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
          <input
            type="date"
            className="rounded border border-white/40 bg-white/90 p-2 text-gray-900"
            value={date}
            min={today}
            placeholder="Pick a date"
            aria-label="Pick a date"
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            className="rounded bg-white p-2 font-medium text-gray-900 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isCheckingSlots}
            onClick={checkAvailability}
          >
            {isCheckingSlots ? "Checking..." : "Check slots"}
          </button>
        </div>
        <p className="mt-2 text-sm text-white/90">
          {selectedService ? selectedService.description : "Pick a service to view its description."}
        </p>

        <ul className="mt-6 space-y-2">
          {slots.map((slot) => (
            <li
              key={slot.startAt}
              className={`flex items-center justify-between rounded border p-3 text-sm ${
                selectedSlot === slot.startAt ? "border-white bg-white/30" : "border-white/40 bg-white/15"
              }`}
            >
              <span>{formatSlot(slot)}</span>
              <button
                className={`rounded px-2 py-1 ${
                  selectedSlot === slot.startAt ? "bg-gray-900 text-white" : "border border-white/60 bg-white/80 text-gray-900"
                }`}
                aria-pressed={selectedSlot === slot.startAt}
                onClick={() => setSelectedSlot(slot.startAt)}
              >
                {selectedSlot === slot.startAt ? "Selected" : "Select"}
              </button>
            </li>
          ))}
        </ul>
        {!slots.length && !isCheckingSlots ? <p className="mt-4 text-sm text-white/90">No time slots to display yet.</p> : null}

        <div className="mt-4 rounded bg-white/90 p-4 text-gray-900 shadow">
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
          <p className="mt-2 text-xs text-gray-700">You must accept policies before submitting your booking.</p>
          <p className="mt-1 text-xs text-gray-700">
            {canCreateBooking
              ? "You're ready to submit your booking."
              : "To submit, select a service, choose a date, pick a slot, and accept policies."}
          </p>
          <p className="mt-2 text-sm text-gray-900">Selected slot: {selectedSlotDetails ? formatSlot(selectedSlotDetails) : "None"}</p>
          <button
            className="mt-2 rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            disabled={!canCreateBooking}
            onClick={async () => {
            if (!canCreateBooking) {
              setMessage("Please select a service, date, and slot, then accept policies before submitting.");
              return;
            }

            const res = await fetch("/api/bookings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ serviceId, startAt: selectedSlot, policyAccepted: acceptPolicies }),
            });
            const data = await res.json();
            if (!res.ok) {
              if (res.status === 401) {
                setAuthRequired(true);
              }
              setMessage(data.error || "Failed");
              return;
            }

            setAuthRequired(false);

            setMessage(
              data.requiresPayment
                ? `Booking ${data.bookingId} created. Deposit payment is required before confirmation.`
                : `Booking ${data.bookingId} confirmed.`
            );

            router.push(`/portal/appointments/${data.bookingId}`);
            }}
          >
            Create booking
          </button>
          {message ? <p className="mt-2 text-sm">{message}</p> : null}
          {authRequired ? (
            <p className="mt-2 text-sm text-gray-800">
              You need an account to book. <Link href="/register?redirectTo=%2Fbook" className="underline">Create account</Link> or{" "}
              <Link href="/login?redirectTo=%2Fbook" className="underline">sign in</Link> to continue.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
