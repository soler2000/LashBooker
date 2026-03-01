"use client";

import { useEffect, useState } from "react";

type AdminPaymentsResponse = {
  depositRequired: boolean;
  bookingCtaTitle: string;
  bookingCtaBody: string;
  bookingCtaButtonLabel: string;
};

export default function PaymentsPage() {
  const [depositRequired, setDepositRequired] = useState(true);
  const [bookingCtaTitle, setBookingCtaTitle] = useState("");
  const [bookingCtaBody, setBookingCtaBody] = useState("");
  const [bookingCtaButtonLabel, setBookingCtaButtonLabel] = useState("");
  const [status, setStatus] = useState("");

  const loadSettings = async () => {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    if (!response.ok) {
      setStatus("Could not load payment settings.");
      return;
    }

    const data = (await response.json()) as AdminPaymentsResponse;
    setDepositRequired(data.depositRequired);
    setBookingCtaTitle(data.bookingCtaTitle ?? "");
    setBookingCtaBody(data.bookingCtaBody ?? "");
    setBookingCtaButtonLabel(data.bookingCtaButtonLabel ?? "");
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const saveSettings = async () => {
    setStatus("");
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        depositRequired,
        bookingCtaTitle,
        bookingCtaBody,
        bookingCtaButtonLabel,
      }),
    });

    if (!response.ok) {
      setStatus("Could not save payment settings.");
      return;
    }

    setStatus("Payment settings saved.");
  };

  return (
    <section className="max-w-3xl space-y-6 text-slate-100">
      <div>
        <h1 className="text-2xl font-semibold text-white">Payments</h1>
        <p className="mt-1 text-sm text-slate-300">Manage booking deposits and payment-related booking call-to-action text.</p>
      </div>

      <section className="space-y-4 rounded border border-slate-800 bg-slate-950 p-4">
        <h2 className="text-lg font-semibold">Booking deposits</h2>
        <p className="text-sm text-slate-300">Choose whether clients must pay a Stripe deposit before a booking is confirmed.</p>
        <label className="flex items-center gap-2 text-sm text-slate-100">
          <input
            type="checkbox"
            checked={depositRequired}
            onChange={(event) => setDepositRequired(event.target.checked)}
          />
          Require deposit payment for new bookings
        </label>
      </section>

      <section className="space-y-4 rounded border border-slate-800 bg-slate-950 p-4">
        <h2 className="text-lg font-semibold">Booking call-to-action</h2>
        <p className="text-sm text-slate-300">Edit the booking call-to-action shown on the homepage.</p>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-100">
            <span>Booking CTA title</span>
            <input
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              maxLength={320}
              value={bookingCtaTitle}
              onChange={(event) => setBookingCtaTitle(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>Booking CTA button label</span>
            <input
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              maxLength={320}
              value={bookingCtaButtonLabel}
              onChange={(event) => setBookingCtaButtonLabel(event.target.value)}
            />
          </label>
        </div>

        <label className="space-y-1 text-sm text-slate-100">
          <span>Booking CTA description</span>
          <textarea
            className="min-h-20 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            maxLength={320}
            value={bookingCtaBody}
            onChange={(event) => setBookingCtaBody(event.target.value)}
          />
        </label>
      </section>

      <button
        type="button"
        className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200"
        onClick={saveSettings}
      >
        Save payment settings
      </button>
      {status ? <p className="text-sm text-slate-200">{status}</p> : null}
    </section>
  );
}
