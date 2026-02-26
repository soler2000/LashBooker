"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type WorkingHour = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isClosed: boolean;
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getFirstAvailableWeekday(workingHoursByDay: Map<number, WorkingHour>) {
  const available = weekdays.findIndex((_, idx) => !workingHoursByDay.has(idx));
  return available === -1 ? 1 : available;
}

export default function OpeningTimesManager() {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [workingHoursStatus, setWorkingHoursStatus] = useState("");
  const [newWorkingHour, setNewWorkingHour] = useState({ weekday: 1, startTime: "09:00", endTime: "17:00", isClosed: false });

  const loadWorkingHours = async () => {
    const response = await fetch("/api/admin/working-hours", { cache: "no-store" });
    if (!response.ok) {
      setWorkingHoursStatus("Could not load working hours.");
      return;
    }
    const rows = (await response.json()) as WorkingHour[];
    setWorkingHours(rows);
  };

  useEffect(() => {
    loadWorkingHours();
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

  return (
    <section className="max-w-4xl space-y-8 text-slate-100">
      <div>
        <h1 className="text-2xl font-semibold text-white">Opening times</h1>
        <p className="mt-2 text-sm text-slate-300">Manage the weekly hours customers can book.</p>
      </div>

      <section className="space-y-4 rounded border border-slate-800 bg-slate-950 p-4">
        <h2 className="text-lg font-semibold">Working hours</h2>
        <p className="text-sm text-slate-300">One record per weekday is allowed.</p>

        <form onSubmit={createWorkingHour} className="grid gap-2 rounded border border-slate-800 bg-slate-950 p-4 md:grid-cols-5">
          <select
            className="rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
            value={newWorkingHour.weekday}
            onChange={(event) => setNewWorkingHour((current) => ({ ...current, weekday: Number(event.target.value) }))}
          >
            {weekdays.map((day, idx) => (
              <option key={day} value={idx} disabled={workingHoursByDay.has(idx)}>{day}</option>
            ))}
          </select>
          <input
            type="time"
            className="rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
            value={newWorkingHour.startTime}
            onChange={(event) => setNewWorkingHour((current) => ({ ...current, startTime: event.target.value }))}
            disabled={newWorkingHour.isClosed}
          />
          <input
            type="time"
            className="rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
            value={newWorkingHour.endTime}
            onChange={(event) => setNewWorkingHour((current) => ({ ...current, endTime: event.target.value }))}
            disabled={newWorkingHour.isClosed}
          />
          <label className="flex items-center gap-2 text-sm text-slate-100">
            <input
              type="checkbox"
              checked={newWorkingHour.isClosed}
              onChange={(event) => setNewWorkingHour((current) => ({ ...current, isClosed: event.target.checked }))}
            />
            Closed
          </label>
          <button
            type="submit"
            className="rounded bg-white px-3 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-200"
            disabled={!hasAvailableWeekday}
          >
            Add day
          </button>
        </form>
        {!hasAvailableWeekday ? <p className="text-sm text-slate-300">All weekdays already have working-hours entries.</p> : null}

        <ul className="space-y-2">
          {workingHours.map((row) => (
            <li key={row.id} className="grid gap-2 rounded border border-slate-800 bg-slate-950 p-4 md:grid-cols-6 md:items-center">
              <p className="text-sm font-medium">{weekdays[row.weekday]}</p>
              <input
                type="time"
                value={row.startTime}
                disabled={row.isClosed}
                className="rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
                onChange={(event) => setWorkingHours((current) => current.map((item) => (item.id === row.id ? { ...item, startTime: event.target.value } : item)))}
              />
              <input
                type="time"
                value={row.endTime}
                disabled={row.isClosed}
                className="rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
                onChange={(event) => setWorkingHours((current) => current.map((item) => (item.id === row.id ? { ...item, endTime: event.target.value } : item)))}
              />
              <label className="flex items-center gap-2 text-sm text-slate-100">
                <input
                  type="checkbox"
                  checked={row.isClosed}
                  onChange={(event) => setWorkingHours((current) => current.map((item) => (item.id === row.id ? { ...item, isClosed: event.target.checked } : item)))}
                />
                Closed
              </label>
              <button type="button" className="rounded bg-white px-3 py-2 text-sm text-black hover:bg-slate-200" onClick={() => updateWorkingHour(row, {})}>Save</button>
              <button type="button" className="rounded border border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-100 hover:bg-slate-900" onClick={() => deleteWorkingHour(row.id)}>Delete</button>
            </li>
          ))}
        </ul>
        {workingHoursStatus ? <p className="text-sm text-slate-200">{workingHoursStatus}</p> : null}
      </section>
    </section>
  );
}
