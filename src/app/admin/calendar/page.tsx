"use client";

import { useEffect, useMemo, useState } from "react";

type Booking = {
  id: string;
  startAt: string;
  endAt: string;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED_BY_CLIENT" | "CANCELLED_BY_ADMIN" | "NO_SHOW";
  notes: string | null;
  serviceName: string;
  servicePriceCents: number;
  serviceDepositType: "NONE" | "FIXED" | "PERCENT";
  serviceDepositValue: number;
  client: {
    id: string;
    email: string;
    clientProfile: {
      firstName: string;
      lastName: string;
      phone: string | null;
    } | null;
  };
  payments: Array<{
    amountCents: number;
    status: "REQUIRES_PAYMENT_METHOD" | "SUCCEEDED" | "FAILED" | "CANCELED" | "REFUNDED" | "PARTIALLY_REFUNDED";
    capturedAt: string | null;
  }>;
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

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "GBP",
  }).format(amountCents / 100);
}

function getDepositRequiredCents(booking: Booking) {
  if (booking.serviceDepositType === "NONE") return 0;
  if (booking.serviceDepositType === "FIXED") return booking.serviceDepositValue;
  return Math.round((booking.servicePriceCents * booking.serviceDepositValue) / 100);
}

export default function AdminCalendarPage() {
  const [view, setView] = useState<"day" | "week">("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockouts, setBlockouts] = useState<Blockout[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [postResultNotes, setPostResultNotes] = useState("");
  const [postResultFiles, setPostResultFiles] = useState<File[]>([]);
  const [savingPostResults, setSavingPostResults] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [journalImageUploadEnabled, setJournalImageUploadEnabled] = useState(false);

  function closeAppointmentDetails() {
    setSelectedBooking(null);
    setPostResultFiles([]);
    setPostResultNotes("");
    setModalError(null);
  }

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
    const [bookingsResponse, capabilitiesResponse] = await Promise.all([
      fetch(`/api/admin/bookings?${params.toString()}`, { cache: "no-store" }),
      fetch("/api/admin/capabilities", { cache: "no-store" }),
    ]);
    const bookingsData = await bookingsResponse.json();
    const capabilitiesData = await capabilitiesResponse.json().catch(() => ({}));
    setBookings(bookingsData.bookings ?? []);
    setBlockouts(bookingsData.blockouts ?? []);
    setJournalImageUploadEnabled(Boolean(capabilitiesData.journalImageUploadEnabled));
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

  async function uploadPostResult(booking: Booking) {
    if (!journalImageUploadEnabled) {
      setModalError("Image uploads are unavailable because storage is not configured. Please set the required S3 environment variables.");
      return;
    }

    if (postResultFiles.length === 0) {
      setModalError("Please select at least one image.");
      return;
    }

    if (!postResultNotes.trim()) {
      setModalError("Please add treatment notes for the journal entry.");
      return;
    }

    setSavingPostResults(true);
    setModalError(null);

    try {
      const uploadedImages: Array<{ objectKey: string; mimeType: string }> = [];

      for (const file of postResultFiles) {
        const presignResponse = await fetch(`/api/admin/clients/${booking.client.id}/journal/images/presign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            contentType: file.type || "application/octet-stream",
            ext: file.name.split(".").pop(),
          }),
        });

        if (!presignResponse.ok) {
          const errorData = (await presignResponse.json().catch(() => ({}))) as {
            error?: string;
            detail?: string;
            message?: string;
          };
          const serverError = errorData.error ?? errorData.detail ?? errorData.message;
          const fallbackError = "Unable to generate upload URL for image.";
          throw new Error(
            serverError
              ? `Upload URL generation failed (${presignResponse.status}): ${serverError}`
              : `${fallbackError} (status ${presignResponse.status})`,
          );
        }
        const presignJson = await presignResponse.json();

        const uploadResponse = await fetch(presignJson.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });

        if (!uploadResponse.ok) throw new Error("Image upload failed.");
        uploadedImages.push({ objectKey: presignJson.objectKey, mimeType: file.type || "application/octet-stream" });
      }

      const createResponse = await fetch(`/api/admin/clients/${booking.client.id}/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          notes: postResultNotes.trim(),
          images: uploadedImages,
        }),
      });

      if (!createResponse.ok) throw new Error("Unable to save post-result photos.");

      setPostResultFiles([]);
      setPostResultNotes("");
      setSelectedBooking(null);
    } catch (error) {
      setModalError(error instanceof Error ? error.message : "Unexpected upload error.");
    } finally {
      setSavingPostResults(false);
    }
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
            <section key={dayKey} className="rounded border bg-white p-3 text-slate-900">
              <h2 className="mb-2 font-semibold text-slate-900">{day.toUTCString().slice(0, 16)}</h2>

              <div className="space-y-2">
                {dayBlockouts.map((blockout) => (
                  <article key={blockout.id} className="rounded border border-amber-300 bg-amber-50 p-2 text-sm">
                    <p className="font-medium">Blockout: {blockout.reason}</p>
                    <p>{new Date(blockout.startAt).toLocaleTimeString()} - {new Date(blockout.endAt).toLocaleTimeString()}</p>
                  </article>
                ))}

                {dayBookings.map((booking) => (
                  <article key={booking.id} className="rounded border border-slate-200 bg-slate-50 p-2 text-sm text-slate-900">
                    <button className="w-full text-left" onClick={() => setSelectedBooking(booking)}>
                      <p className="font-medium text-slate-900">{booking.serviceName}</p>
                      <p className="text-slate-800">{new Date(booking.startAt).toLocaleTimeString()} - {new Date(booking.endAt).toLocaleTimeString()}</p>
                      <p className="text-slate-600">{booking.client.email}</p>
                    </button>
                    <select
                      className="mt-2 w-full rounded border border-slate-300 bg-white px-2 py-1 text-slate-900"
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

      {selectedBooking ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white text-slate-900">
          <div className="min-h-screen w-full p-4 sm:p-6">
            <div className="sticky top-0 z-10 mb-3 flex items-start justify-between border-b bg-white pb-3">
              <div>
                <h2 className="text-xl font-semibold">Appointment details</h2>
                <p className="text-sm text-slate-600">{selectedBooking.serviceName}</p>
              </div>
              <button className="rounded border px-2 py-1 text-sm" onClick={closeAppointmentDetails}>
                Close
              </button>
            </div>

            <div className="grid gap-2 rounded border bg-slate-50 p-3 text-sm">
              <p><span className="font-medium">Client:</span> {selectedBooking.client.clientProfile?.firstName} {selectedBooking.client.clientProfile?.lastName}</p>
              <p><span className="font-medium">Email:</span> {selectedBooking.client.email}</p>
              <p><span className="font-medium">Phone:</span> {selectedBooking.client.clientProfile?.phone || "Not provided"}</p>
              <p><span className="font-medium">Start time:</span> {new Date(selectedBooking.startAt).toLocaleString()}</p>
              <p><span className="font-medium">Price:</span> {formatCurrency(selectedBooking.servicePriceCents)}</p>
              <p>
                <span className="font-medium">Deposit:</span>{" "}
                {getDepositRequiredCents(selectedBooking) === 0
                  ? "No deposit required"
                  : `${formatCurrency(selectedBooking.payments.filter((payment) => payment.status === "SUCCEEDED").reduce((sum, payment) => sum + payment.amountCents, 0))} paid of ${formatCurrency(getDepositRequiredCents(selectedBooking))}`}
              </p>
              {selectedBooking.notes ? <p><span className="font-medium">Notes:</span> {selectedBooking.notes}</p> : null}
            </div>

            <section className="mt-4 space-y-2 rounded border p-3">
              <h3 className="font-medium">Capture post-result photos</h3>
              <p className="text-xs text-slate-600">These files are saved on the client&apos;s profile journal for this appointment.</p>
              {modalError ? <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">{modalError}</p> : null}
              <textarea
                className="min-h-24 w-full rounded border px-3 py-2"
                value={postResultNotes}
                onChange={(event) => setPostResultNotes(event.target.value)}
                placeholder="Procedure notes"
              />
              {!journalImageUploadEnabled ? (
                <p className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
                  Image uploads are disabled because storage is not configured. Set the required S3 environment variables to enable journal image uploads.
                </p>
              ) : (
                <input type="file" multiple accept="image/*" onChange={(event) => setPostResultFiles(Array.from(event.target.files || []))} />
              )}
              <p className="text-xs text-slate-500">{postResultFiles.length} image(s) selected.</p>
              <button
                type="button"
                onClick={() => uploadPostResult(selectedBooking)}
                disabled={savingPostResults || !journalImageUploadEnabled}
                className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {savingPostResults ? "Saving…" : "Save to client journal"}
              </button>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
