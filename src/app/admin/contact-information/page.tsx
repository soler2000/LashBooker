"use client";

import { useEffect, useState } from "react";

type AdminContactResponse = {
  contactPhone: string | null;
  contactEmail: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressPostcode: string | null;
  addressCountry: string | null;
};

export default function ContactInformationPage() {
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressPostcode, setAddressPostcode] = useState("");
  const [addressCountry, setAddressCountry] = useState("");
  const [status, setStatus] = useState("");

  const loadSettings = async () => {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    if (!response.ok) {
      setStatus("Could not load contact information.");
      return;
    }

    const data = (await response.json()) as AdminContactResponse;
    setContactPhone(data.contactPhone ?? "");
    setContactEmail(data.contactEmail ?? "");
    setAddressLine1(data.addressLine1 ?? "");
    setAddressLine2(data.addressLine2 ?? "");
    setAddressCity(data.addressCity ?? "");
    setAddressPostcode(data.addressPostcode ?? "");
    setAddressCountry(data.addressCountry ?? "");
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
        contactPhone: contactPhone.trim() || null,
        contactEmail: contactEmail.trim() || null,
        addressLine1: addressLine1.trim() || null,
        addressLine2: addressLine2.trim() || null,
        addressCity: addressCity.trim() || null,
        addressPostcode: addressPostcode.trim() || null,
        addressCountry: addressCountry.trim() || null,
      }),
    });

    if (!response.ok) {
      setStatus("Could not save contact information.");
      return;
    }

    setStatus("Contact information saved.");
  };

  return (
    <section className="max-w-3xl space-y-6 text-slate-100">
      <div>
        <h1 className="text-2xl font-semibold text-white">Contact information</h1>
        <p className="mt-1 text-sm text-slate-300">Manage the public phone, email, and address information shown on the website.</p>
      </div>

      <section className="space-y-4 rounded border border-slate-800 bg-slate-950 p-4">
        <div className="space-y-1">
          <label htmlFor="contact-phone" className="text-sm font-medium text-slate-100">Business phone number</label>
          <input
            id="contact-phone"
            type="text"
            maxLength={40}
            placeholder="+44 7700 900123"
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="contact-email" className="text-sm font-medium text-slate-100">Business email address</label>
          <input
            id="contact-email"
            type="email"
            maxLength={320}
            placeholder="hello@example.com"
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="address-line-1" className="text-sm font-medium text-slate-100">Address line 1</label>
          <input
            id="address-line-1"
            type="text"
            maxLength={120}
            placeholder="123 Example Street"
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            value={addressLine1}
            onChange={(event) => setAddressLine1(event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="address-line-2" className="text-sm font-medium text-slate-100">Address line 2</label>
          <input
            id="address-line-2"
            type="text"
            maxLength={120}
            placeholder="Suite, unit, or building"
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            value={addressLine2}
            onChange={(event) => setAddressLine2(event.target.value)}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="address-city" className="text-sm font-medium text-slate-100">Town/City</label>
            <input
              id="address-city"
              type="text"
              maxLength={80}
              placeholder="London"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={addressCity}
              onChange={(event) => setAddressCity(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="address-postcode" className="text-sm font-medium text-slate-100">Postcode</label>
            <input
              id="address-postcode"
              type="text"
              maxLength={24}
              placeholder="SW1A 1AA"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={addressPostcode}
              onChange={(event) => setAddressPostcode(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="address-country" className="text-sm font-medium text-slate-100">Country</label>
            <input
              id="address-country"
              type="text"
              maxLength={80}
              placeholder="United Kingdom"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={addressCountry}
              onChange={(event) => setAddressCountry(event.target.value)}
            />
          </div>
        </div>
      </section>

      <button
        type="button"
        className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200"
        onClick={saveSettings}
      >
        Save contact information
      </button>
      {status ? <p className="text-sm text-slate-200">{status}</p> : null}
    </section>
  );
}
