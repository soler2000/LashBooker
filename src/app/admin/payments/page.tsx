"use client";

import { useEffect, useState } from "react";

type AdminPaymentSettingsResponse = {
  depositRequired: boolean;
};

export default function AdminPaymentsPage() {
  const [depositRequired, setDepositRequired] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      const response = await fetch("/api/admin/settings", { cache: "no-store" });
      if (!response.ok) {
        setStatus("Could not load payment settings.");
        return;
      }

      const data = (await response.json()) as AdminPaymentSettingsResponse;
      setDepositRequired(data.depositRequired);
    };

    void loadSettings();
  }, []);

  const savePayments = async () => {
    setStatus("");
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositRequired }),
    });

    if (!response.ok) {
      setStatus("Could not save payment settings.");
      return;
    }

    setStatus(
      depositRequired
        ? "Payment settings saved. Deposits are required for new bookings."
        : "Payment settings saved. Bookings can be confirmed without payment.",
    );
  };

  return (
    <section className="max-w-3xl space-y-4 rounded border border-slate-800 bg-slate-950 p-4 text-slate-100">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Payments</h1>
        <p className="text-sm text-slate-300">Choose whether new bookings can be confirmed without payment.</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-100">
        <input
          type="checkbox"
          checked={depositRequired}
          onChange={(event) => setDepositRequired(event.target.checked)}
        />
        Require deposit payment for new bookings
      </label>

      <button
        type="button"
        className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200"
        onClick={savePayments}
      >
        Save payment settings
      </button>

      {status ? <p className="text-sm text-slate-200">{status}</p> : null}
    </section>
  );
}
