"use client";

import { useEffect, useMemo, useState } from "react";

type Consumable = {
  id: string;
  name: string;
  unit: string | null;
  targetStock: number;
  currentStock: number;
  isActive: boolean;
};

type ConsumableForm = {
  name: string;
  unit: string;
  targetStock: number;
  currentStock: number;
};

const emptyForm: ConsumableForm = {
  name: "",
  unit: "",
  targetStock: 0,
  currentStock: 0,
};

function fromConsumable(consumable: Consumable): ConsumableForm {
  return {
    name: consumable.name,
    unit: consumable.unit ?? "",
    targetStock: consumable.targetStock,
    currentStock: consumable.currentStock,
  };
}

export default function ConsumablesManager() {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [createForm, setCreateForm] = useState<ConsumableForm>(emptyForm);
  const [editing, setEditing] = useState<Record<string, ConsumableForm>>({});
  const [message, setMessage] = useState("");

  const shoppingList = useMemo(() => {
    return consumables
      .filter((item) => item.isActive)
      .map((item) => ({
        ...item,
        toBuy: Math.max(0, item.targetStock - item.currentStock),
      }))
      .filter((item) => item.toBuy > 0);
  }, [consumables]);

  async function loadConsumables() {
    const res = await fetch("/api/admin/consumables", { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error ?? "Unable to load consumables");
      return;
    }

    setConsumables(data.consumables ?? []);
  }

  useEffect(() => {
    void loadConsumables();
  }, []);

  async function createConsumable() {
    const res = await fetch("/api/admin/consumables", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createForm),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Unable to add consumable");
      return;
    }

    setCreateForm(emptyForm);
    setMessage("Consumable added.");
    await loadConsumables();
  }

  async function saveConsumable(id: string) {
    const form = editing[id];
    if (!form) return;

    const res = await fetch(`/api/admin/consumables/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Unable to update consumable");
      return;
    }

    setMessage("Consumable updated.");
    setEditing((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });

    await loadConsumables();
  }

  async function archiveConsumable(id: string) {
    const res = await fetch(`/api/admin/consumables/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error ?? "Unable to archive consumable");
      return;
    }

    setMessage("Consumable archived.");
    await loadConsumables();
  }

  function updateForm<T extends ConsumableForm>(form: T, key: keyof ConsumableForm, value: string) {
    if (["targetStock", "currentStock"].includes(key)) {
      return { ...form, [key]: Math.max(0, Number(value)) };
    }

    return { ...form, [key]: value };
  }

  function renderEditor(form: ConsumableForm, onChange: (key: keyof ConsumableForm, value: string) => void) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          <span>Name</span>
          <input className="rounded border px-3 py-2 font-normal text-slate-900" value={form.name} onChange={(e) => onChange("name", e.target.value)} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          <span>Unit (optional)</span>
          <input className="rounded border px-3 py-2 font-normal text-slate-900" value={form.unit} onChange={(e) => onChange("unit", e.target.value)} placeholder="e.g. bottles, packs, ml" />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          <span>Stock target to keep</span>
          <input className="rounded border px-3 py-2 font-normal text-slate-900" type="number" min="0" value={form.targetStock} onChange={(e) => onChange("targetStock", e.target.value)} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          <span>Current stock</span>
          <input className="rounded border px-3 py-2 font-normal text-slate-900" type="number" min="0" value={form.currentStock} onChange={(e) => onChange("currentStock", e.target.value)} />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message ? <p className="rounded border bg-white p-3 text-sm text-slate-900">{message}</p> : null}

      <section className="space-y-3 rounded border bg-white p-4">
        <h2 className="text-lg font-medium text-slate-900">Add consumable</h2>
        {renderEditor(createForm, (key, value) => setCreateForm((current) => updateForm(current, key, value)))}
        <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" onClick={createConsumable}>Add consumable</button>
      </section>

      <section className="space-y-3 rounded border bg-white p-4 text-slate-900">
        <h2 className="text-lg font-medium">Shopping list</h2>
        {shoppingList.length === 0 ? (
          <p className="text-sm text-slate-600">All active consumables are at or above target stock.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {shoppingList.map((item) => (
              <li key={item.id} className="rounded border bg-slate-50 p-2">
                <strong>{item.name}</strong>: buy <strong>{item.toBuy}</strong>{item.unit ? ` ${item.unit}` : ""} (current {item.currentStock}, target {item.targetStock})
              </li>
            ))}
          </ul>
        )}
      </section>

      <ul className="space-y-2">
        {consumables.map((consumable) => {
          const editForm = editing[consumable.id] ?? fromConsumable(consumable);

          return (
            <li key={consumable.id} className="space-y-3 rounded border bg-white p-4">
              {renderEditor(editForm, (key, value) => setEditing((current) => ({ ...current, [consumable.id]: updateForm(editForm, key, value) })))}
              <div className="flex items-center gap-2">
                <button className="rounded border px-3 py-1 text-sm text-slate-900" onClick={() => saveConsumable(consumable.id)}>Save</button>
                <button className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-700" onClick={() => archiveConsumable(consumable.id)}>Archive</button>
                {!consumable.isActive ? <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">Archived</span> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
