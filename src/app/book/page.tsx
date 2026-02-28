"use client";

import { useEffect, useMemo, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import DepositPaymentForm from "@/components/payments/DepositPaymentForm";

type Service = { id: string; name: string; description: string; priceCents: number };
type Slot = { startAt: string; endAt: string };
type WeeklyAvailabilityDay = { date: string; slots: Slot[] };

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

function formatSlot(slot: Slot) {
  return `${new Date(slot.startAt).toLocaleString()} - ${new Date(slot.endAt).toLocaleTimeString()}`;
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date: string, days: number) {
  const nextDate = parseDate(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return formatDate(nextDate);
}

function getWeekStart(date: string) {
  const parsed = parseDate(date);
  const weekday = parsed.getUTCDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  parsed.setUTCDate(parsed.getUTCDate() + offset);
  return formatDate(parsed);
}

export default function BookPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [weeklySlots, setWeeklySlots] = useState<Record<string, Slot[]>>({});
  const [serviceId, setServiceId] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [message, setMessage] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [acceptPolicies, setAcceptPolicies] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [weekStart, setWeekStart] = useState(getWeekStart(formatDate(new Date())));
  const [paymentClientSecret, setPaymentClientSecret] = useState("");
  const [paymentBookingId, setPaymentBookingId] = useState("");
  const selectedService = services.find((service) => service.id === serviceId);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const allWeekSlots = weekDates.flatMap((date) => weeklySlots[date] ?? []);
  const selectedSlotDetails = allWeekSlots.find((slot) => slot.startAt === selectedSlot);
  const canCreateBooking = Boolean(serviceId && selectedSlot && acceptPolicies);

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

  useEffect(() => {
    fetch("/api/auth/session")
      .then(async (res) => {
        if (!res.ok) {
          setIsLoggedIn(false);
          return;
        }

        const data = await res.json();
        const authenticated = Boolean(data?.user);
        setIsLoggedIn(authenticated);

        if (authenticated) {
          setAuthRequired(false);
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  useEffect(() => {
    if (!serviceId) {
      setWeeklySlots({});
      setAvailabilityError("");
      setSelectedSlot("");
      return;
    }

    setIsCheckingSlots(true);
    setAvailabilityError("");

    fetch(`/api/availability?serviceId=${serviceId}&startDate=${weekStart}&days=7`)
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok || !Array.isArray(data?.days)) {
          setWeeklySlots({});
          setSelectedSlot("");
          setAvailabilityError(typeof data?.error === "string" ? data.error : "Unable to check availability right now.");
          return;
        }

        const grouped = (data.days as WeeklyAvailabilityDay[]).reduce((acc: Record<string, Slot[]>, day) => {
          acc[day.date] = Array.isArray(day.slots) ? day.slots : [];
          return acc;
        }, {});

        setWeeklySlots(grouped);
        setSelectedSlot((current) => (Object.values(grouped).flat().some((slot: Slot) => slot.startAt === current) ? current : ""));
      })
      .catch(() => {
        setWeeklySlots({});
        setSelectedSlot("");
        setAvailabilityError("Unable to check availability right now.");
      })
      .finally(() => {
        setIsCheckingSlots(false);
      });
  }, [serviceId, weekStart]);

  async function handleLogout() {
    await signOut({ redirect: false });
    window.location.reload();
  }

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat px-4 py-10"
      style={{ backgroundImage: "url(https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1800&q=80)" }}
    >
      <div className="mx-auto max-w-6xl rounded-xl bg-black/65 p-8 text-white shadow-2xl backdrop-blur-[2px]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Book an appointment</h1>
          <div className="flex gap-2">
            <Link href="/" className="rounded border border-white/60 px-3 py-2 text-sm font-medium hover:bg-white/20">
              Main menu
            </Link>
            {isLoggedIn ? (
              <button
                className="rounded border border-white/60 px-3 py-2 text-sm font-medium hover:bg-white/20"
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            ) : (
              <>
                <Link href="/login?redirectTo=%2Fbook" className="rounded border border-white/60 px-3 py-2 text-sm font-medium hover:bg-white/20">
                  Sign in
                </Link>
                <Link href="/register?redirectTo=%2Fbook" className="rounded border border-white/60 px-3 py-2 text-sm font-medium hover:bg-white/20">
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <select className="rounded border border-white/40 bg-white/90 p-2 text-gray-900" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            <option value="">Select service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            className="rounded bg-white p-2 font-medium text-gray-900 hover:bg-gray-200"
            type="button"
            onClick={() => setWeekStart(getWeekStart(formatDate(new Date())))}
          >
            This week
          </button>
          <button
            className="rounded bg-white p-2 font-medium text-gray-900 hover:bg-gray-200"
            type="button"
            onClick={() => setWeekStart((current) => addDays(current, 7))}
          >
            Next week
          </button>
        </div>
        <p className="mt-2 text-sm text-white/90">
          {selectedService ? selectedService.description : "Pick a service to view its description."}
        </p>
        <p className="mt-2 text-sm text-white/90">
          Week of {new Date(`${weekStart}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </p>

        {isCheckingSlots ? <p className="mt-4 text-sm text-white/90">Loading weekly availability...</p> : null}
        {availabilityError ? <p className="mt-4 text-sm text-red-200">{availabilityError}</p> : null}

        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-7">
          {weekDates.map((date) => {
            const slots = weeklySlots[date] ?? [];
            return (
              <section key={date} className="rounded border border-white/40 bg-white/10 p-3">
                <h2 className="mb-2 text-sm font-semibold">{new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</h2>
                <div className="space-y-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.startAt}
                      className={`w-full rounded border px-2 py-1 text-left text-xs ${
                        selectedSlot === slot.startAt ? "border-white bg-white/30" : "border-white/50 bg-white/5 hover:bg-white/20"
                      }`}
                      aria-pressed={selectedSlot === slot.startAt}
                      onClick={() => setSelectedSlot(slot.startAt)}
                      type="button"
                    >
                      {new Date(slot.startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </button>
                  ))}
                  {!slots.length ? <p className="text-xs text-white/80">No slots</p> : null}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-4 rounded bg-white/90 p-4 text-gray-900 shadow">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5" checked={acceptPolicies} onChange={(e) => setAcceptPolicies(e.target.checked)} />
            <span>I have read and agree to the studio policies.</span>
          </label>
          <p className="mt-2 text-xs text-gray-700">You must accept policies before submitting your booking.</p>
          <p className="mt-1 text-xs text-gray-700">
            {canCreateBooking
              ? "You're ready to submit your booking."
              : "To submit, select a service, pick a slot, and accept policies."}
          </p>
          <p className="mt-2 text-sm text-gray-900">Selected slot: {selectedSlotDetails ? formatSlot(selectedSlotDetails) : "None"}</p>
          <button
            className="mt-2 rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            disabled={!canCreateBooking}
            onClick={async () => {
              if (!canCreateBooking) {
                setMessage("Please select a service and slot, then accept policies before submitting.");
                return;
              }

              if (!isLoggedIn) {
                setAuthRequired(true);
                setMessage("Please sign in to create a booking.");
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

              if (data.requiresPayment) {
                setPaymentClientSecret(data.clientSecret ?? "");
                setPaymentBookingId(data.bookingId);
                setMessage(`Booking ${data.bookingId} created. Complete your deposit payment below to confirm.`);
                return;
              }

              setMessage(`Booking ${data.bookingId} confirmed.`);
              router.push(`/portal/appointments/${data.bookingId}`);
            }}
          >
            Create booking
          </button>
          {message ? <p className="mt-2 text-sm">{message}</p> : null}
          {paymentClientSecret && paymentBookingId ? (
            <div className="mt-4 rounded border border-gray-300 bg-white p-3">
              {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
                <Elements stripe={stripePromise} options={{ clientSecret: paymentClientSecret }}>
                  <DepositPaymentForm
                    bookingId={paymentBookingId}
                    returnUrl={`${window.location.origin}/portal/appointments/${paymentBookingId}`}
                    onSuccess={() => {
                      setMessage(`Payment successful. Booking ${paymentBookingId} is now confirmed.`);
                      router.push(`/portal/appointments/${paymentBookingId}`);
                    }}
                  />
                </Elements>
              ) : (
                <p className="text-sm text-rose-700">There is no backend configured for credit card payments. Please contact support to complete payment.</p>
              )}
            </div>
          ) : null}
          {authRequired && !isLoggedIn ? (
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
