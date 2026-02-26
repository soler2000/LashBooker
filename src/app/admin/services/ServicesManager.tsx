"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DepositType = "NONE" | "FIXED" | "PERCENT";

type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  depositType: DepositType;
  depositValue: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  isActive: boolean;
};

type ServiceForm = {
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  depositType: DepositType;
  depositValue: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
};

const emptyForm: ServiceForm = {
  name: "",
  description: "",
  durationMinutes: 60,
  price: 0,
  depositType: "NONE",
  depositValue: 0,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
};

function toMoneyNumber(value: number) {
  return Number((value / 100).toFixed(2));
}

function toPayload(form: ServiceForm) {
  const priceCents = Math.max(0, Math.round(form.price * 100));
  const depositValue = form.depositType === "FIXED"
    ? Math.max(0, Math.round(form.depositValue * 100))
    : Math.max(0, Math.round(form.depositValue));

  return {
    name: form.name,
    description: form.description,
    durationMinutes: Math.round(form.durationMinutes),
    priceCents,
    depositType: form.depositType,
    depositValue,
    bufferBeforeMinutes: Math.max(0, Math.round(form.bufferBeforeMinutes)),
    bufferAfterMinutes: Math.max(0, Math.round(form.bufferAfterMinutes)),
  };
}

function fromService(service: Service): ServiceForm {
  return {
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    price: toMoneyNumber(service.priceCents),
    depositType: service.depositType,
    depositValue: service.depositType === "FIXED" ? toMoneyNumber(service.depositValue) : service.depositValue,
    bufferBeforeMinutes: service.bufferBeforeMinutes,
    bufferAfterMinutes: service.bufferAfterMinutes,
  };
}

export default function ServicesManager() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [createForm, setCreateForm] = useState<ServiceForm>(emptyForm);
  const [editing, setEditing] = useState<Record<string, ServiceForm>>({});
  const [message, setMessage] = useState("");

  async function loadServices() {
    const res = await fetch("/api/admin/services", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Unable to load services");
      return;
    }

    setServices(data.services ?? []);
  }

  useEffect(() => {
    void loadServices();
  }, []);

  async function createService() {
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(toPayload(createForm)),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Unable to add service");
      return;
    }

    setCreateForm(emptyForm);
    setMessage("Service added.");
    await loadServices();
    router.refresh();
  }

  async function saveService(id: string) {
    const payload = editing[id];
    if (!payload) return;

    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(toPayload(payload)),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Unable to update service");
      return;
    }

    setMessage("Service updated.");
    setEditing((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    await loadServices();
  }

  async function deleteService(id: string) {
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Unable to archive service");
      return;
    }

    setMessage("Service archived.");
    await loadServices();
  }

  function updateForm<T extends ServiceForm>(form: T, key: keyof ServiceForm, value: string) {
    if (["durationMinutes", "price", "depositValue", "bufferBeforeMinutes", "bufferAfterMinutes"].includes(key)) {
      return { ...form, [key]: Number(value) };
    }
    return { ...form, [key]: value };
  }

  function renderEditor(form: ServiceForm, onChange: (key: keyof ServiceForm, value: string) => void) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          <span>Name</span>
          <input className="rounded border px-3 py-2 font-normal text-slate-900" value={form.name} onChange={(e) => onChange("name", e.target.value)} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2">
          <span>Description</span>
          <textarea
            className="rounded border px-3 py-2 font-normal text-slate-900"
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            rows={3}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          <span>Duration (minutes)</span>
          <input className="rounded border px-3 py-2 font-normal text-slate-900" type="number" value={form.durationMinutes} onChange={(e) => onChange("durationMinutes", e.target.value)} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          <span>Price (£)</span>
          <input className="rounded border px-3 py-2 font-normal text-slate-900" type="number" min="0" step="0.01" value={form.price} onChange={(e) => onChange("price", e.target.value)} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          <span>Deposit type</span>
          <select className="rounded border px-3 py-2 font-normal text-slate-900" value={form.depositType} onChange={(e) => onChange("depositType", e.target.value)}>
            <option value="NONE">No deposit</option>
            <option value="FIXED">Fixed amount</option>
            <option value="PERCENT">Percent</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          <span>Deposit value{form.depositType === "FIXED" ? " (£)" : form.depositType === "PERCENT" ? " (%)" : ""}</span>
          <input className="rounded border px-3 py-2 font-normal text-slate-900" type="number" min="0" step={form.depositType === "FIXED" ? "0.01" : "1"} value={form.depositValue} onChange={(e) => onChange("depositValue", e.target.value)} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          <span>Buffer before (minutes)</span>
          <input className="rounded border px-3 py-2 font-normal text-slate-900" type="number" value={form.bufferBeforeMinutes} onChange={(e) => onChange("bufferBeforeMinutes", e.target.value)} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          <span>Buffer after (minutes)</span>
          <input className="rounded border px-3 py-2 font-normal text-slate-900" type="number" value={form.bufferAfterMinutes} onChange={(e) => onChange("bufferAfterMinutes", e.target.value)} />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message ? <p className="rounded border bg-white p-3 text-sm">{message}</p> : null}

      <section className="space-y-3 rounded border bg-white p-4">
        <h2 className="text-lg font-medium">Add service</h2>
        {renderEditor(createForm, (key, value) => setCreateForm((current) => updateForm(current, key, value)))}
        <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" onClick={createService}>Add service</button>
      </section>

      <ul className="space-y-2">
        {services.map((service) => {
          const editForm = editing[service.id] ?? fromService(service);

          return (
            <li key={service.id} className="space-y-3 rounded border bg-white p-4">
              {renderEditor(editForm, (key, value) => setEditing((current) => ({ ...current, [service.id]: updateForm(editForm, key, value) })))}
              <div className="flex gap-2">
                <button className="rounded border px-3 py-1 text-sm" onClick={() => saveService(service.id)}>Save</button>
                <button className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-700" onClick={() => deleteService(service.id)}>Delete</button>
                {!service.isActive ? <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">Archived</span> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
