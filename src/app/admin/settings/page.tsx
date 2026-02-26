"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { defaultSiteImages, SITE_IMAGES_STORAGE_KEY, type SiteImageKey, type SiteImages } from "@/lib/site-images";

type WorkingHour = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isClosed: boolean;
};

type Blockout = {
  id: string;
  startAt: string;
  endAt: string;
  reason: string;
};

const imageFields: Array<{ key: SiteImageKey; label: string }> = [
  { key: "hero", label: "Hero image" },
  { key: "precision", label: "Precision story image" },
  { key: "closeup", label: "Close-up story image" },
  { key: "luxury", label: "Luxury story image" },
  { key: "booking", label: "Booking panel image" },
  { key: "policies", label: "Policies panel image" },
];

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getFirstAvailableWeekday(workingHoursByDay: Map<number, WorkingHour>) {
  const available = weekdays.findIndex((_, idx) => !workingHoursByDay.has(idx));
  return available === -1 ? 1 : available;
}

function toLocalDatetimeInput(value: string) {
  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function toIsoFromLocalInput(value: string) {
  return new Date(value).toISOString();
}

export default function AdminSettingsPage() {
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const [savedMessage, setSavedMessage] = useState("");

  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [workingHoursStatus, setWorkingHoursStatus] = useState("");
  const [newWorkingHour, setNewWorkingHour] = useState({ weekday: 1, startTime: "09:00", endTime: "17:00", isClosed: false });

  const [blockouts, setBlockouts] = useState<Blockout[]>([]);
  const [blockoutStatus, setBlockoutStatus] = useState("");
  const [newBlockout, setNewBlockout] = useState({ startAt: "", endAt: "", reason: "" });

  useEffect(() => {
    const stored = window.localStorage.getItem(SITE_IMAGES_STORAGE_KEY);

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<SiteImages>;
      setImages({ ...defaultSiteImages, ...parsed });
    } catch {
      setImages(defaultSiteImages);
    }
  }, []);

  const loadWorkingHours = async () => {
    const response = await fetch("/api/admin/working-hours", { cache: "no-store" });
    if (!response.ok) {
      setWorkingHoursStatus("Could not load working hours.");
      return;
    }
    const rows = (await response.json()) as WorkingHour[];
    setWorkingHours(rows);
  };

  const loadBlockouts = async () => {
    const response = await fetch("/api/admin/blockouts", { cache: "no-store" });
    if (!response.ok) {
      setBlockoutStatus("Could not load blockouts.");
      return;
    }
    const rows = (await response.json()) as Blockout[];
    setBlockouts(rows);
  };

  useEffect(() => {
    loadWorkingHours();
    loadBlockouts();
  }, []);

  const workingHoursByDay = useMemo(() => {
    const grouped = new Map<number, WorkingHour>();
    for (const row of workingHours) grouped.set(row.weekday, row);
    return grouped;
  }, [workingHours]);
  const hasAvailableWeekday = workingHoursByDay.size < weekdays.length;

  useEffect(() => {
    setNewWorkingHour((current) => {
      if (!workingHoursByDay.has(current.weekday)) {
        return current;
      }

      return {
        ...current,
        weekday: getFirstAvailableWeekday(workingHoursByDay),
      };
    });
  }, [workingHoursByDay]);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.localStorage.setItem(SITE_IMAGES_STORAGE_KEY, JSON.stringify(images));
    setSavedMessage("Saved. Refresh the front page to see updates.");
  };

  const createWorkingHour = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWorkingHoursStatus("");
    const response = await fetch("/api/admin/working-hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newWorkingHour),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setWorkingHoursStatus(data.error ?? "Could not create working-hours row.");
      return;
    }

    setNewWorkingHour((current) => ({
      ...current,
      weekday: getFirstAvailableWeekday(workingHoursByDay),
      startTime: "09:00",
      endTime: "17:00",
      isClosed: false,
    }));
    setWorkingHoursStatus("Working hours saved.");
    await loadWorkingHours();
  };

  const updateWorkingHour = async (row: WorkingHour, patch: Partial<WorkingHour>) => {
    setWorkingHoursStatus("");
    const response = await fetch(`/api/admin/working-hours/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...row, ...patch }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setWorkingHoursStatus(data.error ?? "Could not update row.");
      return;
    }

    await loadWorkingHours();
  };

  const deleteWorkingHour = async (id: string) => {
    setWorkingHoursStatus("");
    const response = await fetch(`/api/admin/working-hours/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setWorkingHoursStatus("Could not delete row.");
      return;
    }
    setWorkingHoursStatus("Deleted.");
    await loadWorkingHours();
  };

  const createBlockout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBlockoutStatus("");
    const response = await fetch("/api/admin/blockouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newBlockout,
        startAt: toIsoFromLocalInput(newBlockout.startAt),
        endAt: toIsoFromLocalInput(newBlockout.endAt),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setBlockoutStatus(data.error ?? "Could not create blockout.");
      return;
    }

    setNewBlockout({ startAt: "", endAt: "", reason: "" });
    setBlockoutStatus("Blockout saved.");
    await loadBlockouts();
  };

  const updateBlockout = async (row: Blockout, patch: Partial<Blockout>) => {
    setBlockoutStatus("");
    const response = await fetch(`/api/admin/blockouts/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...row, ...patch }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setBlockoutStatus(data.error ?? "Could not update blockout.");
      return;
    }

    await loadBlockouts();
  };

  const deleteBlockout = async (id: string) => {
    setBlockoutStatus("");
    const response = await fetch(`/api/admin/blockouts/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setBlockoutStatus("Could not delete blockout.");
      return;
    }
    setBlockoutStatus("Deleted.");
    await loadBlockouts();
  };

  return (
    <section className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Owner settings</h1>
        <p className="mt-2 text-sm text-slate-600">Update homepage image URLs, weekly working-hours windows, and calendar blockouts.</p>
      </div>

      <form className="space-y-4" onSubmit={save}>
        <h2 className="text-lg font-semibold">Homepage images</h2>
        {imageFields.map((field) => (
          <label key={field.key} className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">{field.label}</span>
            <input
              type="url"
              className="w-full rounded border p-2 text-sm"
              value={images[field.key]}
              onChange={(event) => setImages((current) => ({ ...current, [field.key]: event.target.value }))}
            />
          </label>
        ))}

        <button type="submit" className="rounded bg-black px-4 py-2 text-sm font-medium text-white">
          Save image settings
        </button>
        {savedMessage ? <p className="text-sm text-green-700">{savedMessage}</p> : null}
      </form>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Working hours</h2>
        <p className="text-sm text-slate-600">One record per weekday is allowed.</p>

        <form onSubmit={createWorkingHour} className="grid gap-2 rounded border p-4 md:grid-cols-5">
          <select
            className="rounded border p-2 text-sm"
            value={newWorkingHour.weekday}
            onChange={(event) => setNewWorkingHour((current) => ({ ...current, weekday: Number(event.target.value) }))}
          >
            {weekdays.map((day, idx) => (
              <option key={day} value={idx} disabled={workingHoursByDay.has(idx)}>{day}</option>
            ))}
          </select>
          <input
            type="time"
            className="rounded border p-2 text-sm"
            value={newWorkingHour.startTime}
            onChange={(event) => setNewWorkingHour((current) => ({ ...current, startTime: event.target.value }))}
            disabled={newWorkingHour.isClosed}
          />
          <input
            type="time"
            className="rounded border p-2 text-sm"
            value={newWorkingHour.endTime}
            onChange={(event) => setNewWorkingHour((current) => ({ ...current, endTime: event.target.value }))}
            disabled={newWorkingHour.isClosed}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={newWorkingHour.isClosed}
              onChange={(event) => setNewWorkingHour((current) => ({ ...current, isClosed: event.target.checked }))}
            />
            Closed
          </label>
          <button
            type="submit"
            className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={!hasAvailableWeekday}
          >
            Add day
          </button>
        </form>
        {!hasAvailableWeekday ? <p className="text-sm text-slate-600">All weekdays already have working-hours entries.</p> : null}

        <ul className="space-y-2">
          {workingHours.map((row) => (
            <li key={row.id} className="grid gap-2 rounded border bg-white p-4 md:grid-cols-6 md:items-center">
              <p className="text-sm font-medium">{weekdays[row.weekday]}</p>
              <input
                type="time"
                value={row.startTime}
                disabled={row.isClosed}
                className="rounded border p-2 text-sm"
                onChange={(event) => setWorkingHours((current) => current.map((item) => (item.id === row.id ? { ...item, startTime: event.target.value } : item)))}
              />
              <input
                type="time"
                value={row.endTime}
                disabled={row.isClosed}
                className="rounded border p-2 text-sm"
                onChange={(event) => setWorkingHours((current) => current.map((item) => (item.id === row.id ? { ...item, endTime: event.target.value } : item)))}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.isClosed}
                  onChange={(event) => setWorkingHours((current) => current.map((item) => (item.id === row.id ? { ...item, isClosed: event.target.checked } : item)))}
                />
                Closed
              </label>
              <button type="button" className="rounded bg-slate-900 px-3 py-2 text-sm text-white" onClick={() => updateWorkingHour(row, {})}>Save</button>
              <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => deleteWorkingHour(row.id)}>Delete</button>
            </li>
          ))}
        </ul>
        {workingHoursStatus ? <p className="text-sm text-slate-700">{workingHoursStatus}</p> : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Blockouts</h2>
        <form onSubmit={createBlockout} className="grid gap-2 rounded border p-4 md:grid-cols-4">
          <input
            type="datetime-local"
            required
            className="rounded border p-2 text-sm"
            value={newBlockout.startAt}
            onChange={(event) => setNewBlockout((current) => ({ ...current, startAt: event.target.value }))}
          />
          <input
            type="datetime-local"
            required
            className="rounded border p-2 text-sm"
            value={newBlockout.endAt}
            onChange={(event) => setNewBlockout((current) => ({ ...current, endAt: event.target.value }))}
          />
          <input
            type="text"
            required
            className="rounded border p-2 text-sm"
            placeholder="Reason"
            value={newBlockout.reason}
            onChange={(event) => setNewBlockout((current) => ({ ...current, reason: event.target.value }))}
          />
          <button type="submit" className="rounded bg-black px-3 py-2 text-sm font-medium text-white">Add blockout</button>
        </form>

        <ul className="space-y-2">
          {blockouts.map((row) => (
            <li key={row.id} className="grid gap-2 rounded border bg-white p-4 md:grid-cols-5 md:items-center">
              <input
                type="datetime-local"
                className="rounded border p-2 text-sm"
                value={toLocalDatetimeInput(row.startAt)}
                onChange={(event) => setBlockouts((current) => current.map((item) => (item.id === row.id ? { ...item, startAt: toIsoFromLocalInput(event.target.value) } : item)))}
              />
              <input
                type="datetime-local"
                className="rounded border p-2 text-sm"
                value={toLocalDatetimeInput(row.endAt)}
                onChange={(event) => setBlockouts((current) => current.map((item) => (item.id === row.id ? { ...item, endAt: toIsoFromLocalInput(event.target.value) } : item)))}
              />
              <input
                type="text"
                className="rounded border p-2 text-sm"
                value={row.reason}
                onChange={(event) => setBlockouts((current) => current.map((item) => (item.id === row.id ? { ...item, reason: event.target.value } : item)))}
              />
              <button type="button" className="rounded bg-slate-900 px-3 py-2 text-sm text-white" onClick={() => updateBlockout(row, {})}>Save</button>
              <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => deleteBlockout(row.id)}>Delete</button>
            </li>
          ))}
        </ul>
        {blockoutStatus ? <p className="text-sm text-slate-700">{blockoutStatus}</p> : null}
      </section>
    </section>
  );
}
