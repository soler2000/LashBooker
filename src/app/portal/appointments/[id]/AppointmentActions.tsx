"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

type AppointmentActionsProps = {
  bookingId: string;
  canManage: boolean;
};

export default function AppointmentActions({ bookingId, canManage }: AppointmentActionsProps) {
  const router = useRouter();
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<"cancel" | "reschedule" | null>(null);

  const onCancel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage) return;

    setPendingAction("cancel");
    setMessage("");
    const res = await fetch(`/api/portal/bookings/${bookingId}/cancel`, { method: "PUT" });
    const payload = await res.json();
    setMessage(res.ok ? "Appointment canceled." : payload.error ?? "Cancel failed");
    setPendingAction(null);
    if (res.ok) router.refresh();
  };

  const onReschedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage || !rescheduleAt) return;

    setPendingAction("reschedule");
    setMessage("");
    const startAt = new Date(rescheduleAt).toISOString();

    const res = await fetch(`/api/portal/bookings/${bookingId}/reschedule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startAt }),
    });
    const payload = await res.json();
    setMessage(res.ok ? "Appointment rescheduled." : payload.error ?? "Reschedule failed");
    setPendingAction(null);
    if (res.ok) {
      setRescheduleAt("");
      router.refresh();
    }
  };

  return (
    <section className="space-y-4 rounded border bg-white p-4">
      <h2 className="text-lg font-medium">Manage appointment</h2>
      {message ? <p className="rounded border bg-slate-50 p-3 text-sm">{message}</p> : null}

      {!canManage ? (
        <p className="text-sm text-slate-600">This appointment can no longer be changed from the portal.</p>
      ) : (
        <>
          <form className="space-y-2" onSubmit={onReschedule}>
            <label htmlFor="rescheduleAt" className="block text-sm font-medium">Reschedule date &amp; time</label>
            <input
              id="rescheduleAt"
              type="datetime-local"
              value={rescheduleAt}
              onChange={(event) => setRescheduleAt(event.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              className="rounded border px-3 py-2 text-sm"
              disabled={pendingAction !== null}
            >
              {pendingAction === "reschedule" ? "Rescheduling…" : "Submit reschedule request"}
            </button>
          </form>

          <form onSubmit={onCancel}>
            <button
              type="submit"
              className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              disabled={pendingAction !== null}
            >
              {pendingAction === "cancel" ? "Canceling…" : "Cancel appointment"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
