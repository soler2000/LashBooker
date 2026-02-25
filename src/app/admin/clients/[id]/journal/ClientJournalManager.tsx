"use client";

import { useEffect, useMemo, useState } from "react";

type BookingSummary = {
  id: string;
  startAt: string;
  status: string;
  service: { name: string };
};

type ClientPayload = {
  id: string;
  email: string;
  clientProfile: {
    firstName: string;
    lastName: string;
    phone: string | null;
    notes: string | null;
    contraindications: string | null;
  } | null;
  bookings: BookingSummary[];
};

type JournalEntry = {
  id: string;
  notes: string;
  createdAt: string;
  booking: { id: string; startAt: string; service: { name: string } };
  createdBy: { email: string };
  images: Array<{ id: string; mimeType: string; createdAt: string; readUrl: string | null }>;
};

const MIN_IMAGES = 1;
const MAX_IMAGES = 6;

export default function ClientJournalManager({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<ClientPayload | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", phone: "", notes: "", contraindications: "" });
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [entryNotes, setEntryNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [clientResponse, journalResponse] = await Promise.all([
        fetch(`/api/admin/clients/${clientId}`),
        fetch(`/api/admin/clients/${clientId}/journal`),
      ]);

      if (!clientResponse.ok || !journalResponse.ok) throw new Error("Failed to load client data");

      const clientJson = await clientResponse.json();
      const journalJson = await journalResponse.json();
      const loadedClient: ClientPayload = clientJson.client;

      setClient(loadedClient);
      setEntries(journalJson.entries || []);
      setSelectedBookingId(loadedClient.bookings?.[0]?.id || "");
      setProfileForm({
        firstName: loadedClient.clientProfile?.firstName || "",
        lastName: loadedClient.clientProfile?.lastName || "",
        phone: loadedClient.clientProfile?.phone || "",
        notes: loadedClient.clientProfile?.notes || "",
        contraindications: loadedClient.clientProfile?.contraindications || "",
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [clientId]);

  const canCreateEntry = useMemo(() => {
    return Boolean(selectedBookingId && entryNotes.trim() && files.length >= MIN_IMAGES && files.length <= MAX_IMAGES);
  }, [selectedBookingId, entryNotes, files.length]);

  async function saveProfile() {
    setSavingProfile(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone || null,
          notes: profileForm.notes || null,
          contraindications: profileForm.contraindications || null,
        }),
      });
      if (!response.ok) throw new Error("Unable to update profile");
      await loadData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unexpected error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function createEntry() {
    if (!canCreateEntry) return;
    setSavingEntry(true);
    setError(null);

    try {
      const uploadedImages: Array<{ objectKey: string; mimeType: string }> = [];

      for (const file of files) {
        const presignResponse = await fetch(`/api/admin/clients/${clientId}/journal/images/presign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: selectedBookingId,
            contentType: file.type || "application/octet-stream",
            ext: file.name.split(".").pop(),
          }),
        });

        if (!presignResponse.ok) throw new Error("Unable to generate upload URL");
        const presignJson = await presignResponse.json();

        const uploadResponse = await fetch(presignJson.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });

        if (!uploadResponse.ok) throw new Error("File upload failed");
        uploadedImages.push({ objectKey: presignJson.objectKey, mimeType: file.type || "application/octet-stream" });
      }

      const createResponse = await fetch(`/api/admin/clients/${clientId}/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: selectedBookingId, notes: entryNotes, images: uploadedImages }),
      });

      if (!createResponse.ok) throw new Error("Unable to create journal entry");

      setEntryNotes("");
      setFiles([]);
      await loadData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unexpected error");
    } finally {
      setSavingEntry(false);
    }
  }

  if (loading) return <p>Loading client details…</p>;
  if (!client) return <p>Client not found.</p>;

  return (
    <div className="space-y-6">
      {error ? <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}

      <section className="space-y-3 rounded border bg-white p-4">
        <h2 className="text-lg font-medium">Profile</h2>
        <p className="text-sm text-slate-600">{client.email}</p>
        <div className="grid gap-2 md:grid-cols-2">
          <input className="rounded border px-3 py-2" value={profileForm.firstName} onChange={(e) => setProfileForm((v) => ({ ...v, firstName: e.target.value }))} placeholder="First name" />
          <input className="rounded border px-3 py-2" value={profileForm.lastName} onChange={(e) => setProfileForm((v) => ({ ...v, lastName: e.target.value }))} placeholder="Last name" />
          <input className="rounded border px-3 py-2 md:col-span-2" value={profileForm.phone} onChange={(e) => setProfileForm((v) => ({ ...v, phone: e.target.value }))} placeholder="Phone" />
          <textarea className="min-h-24 rounded border px-3 py-2 md:col-span-2" value={profileForm.notes} onChange={(e) => setProfileForm((v) => ({ ...v, notes: e.target.value }))} placeholder="Client notes" />
          <textarea className="min-h-24 rounded border px-3 py-2 md:col-span-2" value={profileForm.contraindications} onChange={(e) => setProfileForm((v) => ({ ...v, contraindications: e.target.value }))} placeholder="Contraindications" />
        </div>
        <button type="button" onClick={saveProfile} disabled={savingProfile} className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50">{savingProfile ? "Saving…" : "Save profile"}</button>
      </section>

      <section className="space-y-3 rounded border bg-white p-4">
        <h2 className="text-lg font-medium">Add journal entry</h2>
        <select value={selectedBookingId} onChange={(e) => setSelectedBookingId(e.target.value)} className="w-full rounded border px-3 py-2">
          <option value="">Select appointment</option>
          {client.bookings.map((booking) => (
            <option key={booking.id} value={booking.id}>{new Date(booking.startAt).toLocaleString()} · {booking.service.name} · {booking.status}</option>
          ))}
        </select>
        <textarea className="min-h-24 w-full rounded border px-3 py-2" value={entryNotes} onChange={(e) => setEntryNotes(e.target.value)} placeholder="Procedure notes" />
        <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
        <p className="text-xs text-slate-500">Attach {MIN_IMAGES} to {MAX_IMAGES} images per appointment.</p>
        <button type="button" onClick={createEntry} disabled={!canCreateEntry || savingEntry} className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50">{savingEntry ? "Saving…" : "Create journal entry"}</button>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Journal history</h2>
        {entries.length === 0 ? <p className="text-sm text-slate-600">No journal entries yet.</p> : null}
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="space-y-3 rounded border bg-white p-4">
              <div className="text-sm text-slate-600">
                <p>{new Date(entry.createdAt).toLocaleString()} · {entry.booking.service.name}</p>
                <p>Added by {entry.createdBy.email}</p>
              </div>
              <p className="whitespace-pre-wrap">{entry.notes}</p>
              <div className="grid gap-2 md:grid-cols-3">
                {entry.images.map((image) => (
                  image.readUrl ? (
                  <a key={image.id} href={image.readUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded border">
                    <img src={image.readUrl} alt="Journal" className="h-40 w-full object-cover" />
                  </a>
                ) : (
                  <div key={image.id} className="flex h-40 items-center justify-center rounded border bg-slate-100 text-xs text-slate-600">Image unavailable</div>
                )
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
