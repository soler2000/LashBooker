"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { defaultSiteImages, SITE_IMAGES_STORAGE_KEY, siteImageUsage, type SiteImageKey, type SiteImages } from "@/lib/site-images";

type AdminSettingsResponse = {
  depositRequired: boolean;
  mailProviderType: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUsername: string | null;
  smtpSecretRef: string | null;
  mailFromName: string | null;
  mailFromEmail: string | null;
  mailReplyTo: string | null;
  smtpUseTls: boolean;
  smtpUseStarttls: boolean;
  smtpPasswordConfigured: boolean;
};

type MailSettingsForm = {
  mailProviderType: string;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecretRef: string;
  mailFromName: string;
  mailFromEmail: string;
  mailReplyTo: string;
  smtpUseTls: boolean;
  smtpUseStarttls: boolean;
};

type AccountRole = "STAFF" | "ADMIN" | "OWNER";

type CreateAccountForm = {
  email: string;
  password: string;
  role: AccountRole;
  mustChangePassword: boolean;
};

type AdminAccount = {
  id: string;
  email: string;
  role: AccountRole;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

const defaultMailSettings: MailSettingsForm = {
  mailProviderType: "",
  smtpHost: "",
  smtpPort: "",
  smtpUsername: "",
  smtpPassword: "",
  smtpSecretRef: "",
  mailFromName: "",
  mailFromEmail: "",
  mailReplyTo: "",
  smtpUseTls: false,
  smtpUseStarttls: false,
};

const defaultCreateAccountForm: CreateAccountForm = {
  email: "",
  password: "",
  role: "STAFF",
  mustChangePassword: true,
};

type Blockout = {
  id: string;
  startAt: string;
  endAt: string;
  reason: string;
};

const imageFields: Array<{ key: SiteImageKey; label: string }> = (Object.keys(defaultSiteImages) as SiteImageKey[]).map((key) => ({
  key,
  label: siteImageUsage[key].label,
}));

const idealImageDimensions: Record<SiteImageKey, string> = {
  hero: "2000 × 1200 px",
  precision: "1800 × 1200 px",
  closeup: "1800 × 1200 px",
  luxury: "1800 × 1200 px",
  booking: "1800 × 1200 px",
  policies: "1800 × 1200 px",
};

function toLocalDatetimeInput(value: string) {
  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function toIsoFromLocalInput(value: string) {
  return new Date(value).toISOString();
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

export default function AdminSettingsPage() {
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const [savedMessage, setSavedMessage] = useState("");
  const [imageUploadStatus, setImageUploadStatus] = useState("");

  const [blockouts, setBlockouts] = useState<Blockout[]>([]);
  const [blockoutStatus, setBlockoutStatus] = useState("");
  const [newBlockout, setNewBlockout] = useState({ startAt: "", endAt: "", reason: "" });
  const [depositRequired, setDepositRequired] = useState(true);
  const [depositStatus, setDepositStatus] = useState("");
  const [mailSettings, setMailSettings] = useState<MailSettingsForm>(defaultMailSettings);
  const [mailStatus, setMailStatus] = useState("");
  const [smtpPasswordConfigured, setSmtpPasswordConfigured] = useState(false);
  const [createAccountForm, setCreateAccountForm] = useState<CreateAccountForm>(defaultCreateAccountForm);
  const [createAccountStatus, setCreateAccountStatus] = useState("");
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [accountsStatus, setAccountsStatus] = useState("");

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

  const loadBlockouts = async () => {
    const response = await fetch("/api/admin/blockouts", { cache: "no-store" });
    if (!response.ok) {
      setBlockoutStatus("Could not load blockouts.");
      return;
    }
    const rows = (await response.json()) as Blockout[];
    setBlockouts(rows);
  };

  const loadDepositSettings = async () => {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    if (!response.ok) {
      setDepositStatus("Could not load deposit settings.");
      setMailStatus("Could not load email server settings.");
      return;
    }

    const data = (await response.json()) as AdminSettingsResponse;
    setDepositRequired(data.depositRequired);
    setMailSettings({
      mailProviderType: data.mailProviderType ?? "",
      smtpHost: data.smtpHost ?? "",
      smtpPort: data.smtpPort?.toString() ?? "",
      smtpUsername: data.smtpUsername ?? "",
      smtpPassword: "",
      smtpSecretRef: data.smtpSecretRef ?? "",
      mailFromName: data.mailFromName ?? "",
      mailFromEmail: data.mailFromEmail ?? "",
      mailReplyTo: data.mailReplyTo ?? "",
      smtpUseTls: data.smtpUseTls,
      smtpUseStarttls: data.smtpUseStarttls,
    });
    setSmtpPasswordConfigured(data.smtpPasswordConfigured);
  };

  const loadAccounts = async () => {
    const response = await fetch("/api/admin/accounts", { cache: "no-store" });
    if (!response.ok) {
      setAccountsStatus("Could not load admin accounts.");
      return;
    }

    const rows = (await response.json()) as AdminAccount[];
    setAccounts(rows);
    setAccountsStatus("");
  };

  useEffect(() => {
    loadBlockouts();
    loadDepositSettings();
    loadAccounts();
  }, []);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.localStorage.setItem(SITE_IMAGES_STORAGE_KEY, JSON.stringify(images));
    setSavedMessage("Saved. Refresh the front page to see updates.");
  };

  const uploadImage = async (key: SiteImageKey, file: File | null) => {
    if (!file) {
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setImages((current) => ({ ...current, [key]: dataUrl }));
      setImageUploadStatus(`${imageFields.find((field) => field.key === key)?.label ?? "Image"} uploaded. Click save to apply.`);
    } catch {
      setImageUploadStatus("Could not upload image. Please try a different file.");
    }
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

  const saveDepositSettings = async () => {
    setDepositStatus("");
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositRequired }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setDepositStatus(data.error ?? "Could not save deposit settings.");
      return;
    }

    setDepositStatus(depositRequired ? "Deposits are required for new bookings." : "Deposits are disabled. Bookings confirm immediately.");
  };

  const saveMailSettings = async () => {
    setMailStatus("");
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mailProviderType: mailSettings.mailProviderType || null,
        smtpHost: mailSettings.smtpHost || null,
        smtpPort: mailSettings.smtpPort ? Number(mailSettings.smtpPort) : null,
        smtpUsername: mailSettings.smtpUsername || null,
        smtpPassword: mailSettings.smtpPassword || undefined,
        smtpSecretRef: mailSettings.smtpSecretRef || null,
        mailFromName: mailSettings.mailFromName || null,
        mailFromEmail: mailSettings.mailFromEmail || null,
        mailReplyTo: mailSettings.mailReplyTo || null,
        smtpUseTls: mailSettings.smtpUseTls,
        smtpUseStarttls: mailSettings.smtpUseStarttls,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMailStatus(data.error ?? "Could not save email server settings.");
      return;
    }

    const data = (await response.json()) as AdminSettingsResponse;
    setSmtpPasswordConfigured(data.smtpPasswordConfigured);
    setMailSettings((current) => ({ ...current, smtpPassword: "" }));
    setMailStatus("Email server settings saved.");
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

  const createAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateAccountStatus("");

    const response = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createAccountForm),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setCreateAccountStatus(data.error ?? "Could not create account.");
      return;
    }

    setCreateAccountForm((current) => ({
      ...defaultCreateAccountForm,
      role: current.role,
      mustChangePassword: current.mustChangePassword,
    }));
    setCreateAccountStatus("Account created.");
    await loadAccounts();
  };

  const removeAccount = async (account: AdminAccount) => {
    const confirmed = window.confirm(`Remove ${account.email}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setAccountsStatus("");
    const response = await fetch(`/api/admin/accounts/${account.id}`, { method: "DELETE" });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setAccountsStatus(data.error ?? "Could not remove account.");
      return;
    }

    setAccountsStatus(`Removed ${account.email}.`);
    await loadAccounts();
  };

  return (
    <section className="max-w-4xl space-y-10 text-slate-100">
      <div>
        <h1 className="text-2xl font-semibold text-white">Owner settings</h1>
        <p className="mt-2 text-sm text-slate-300">Upload homepage background images, deposit requirements, email server settings, and calendar blockouts.</p>
      </div>

      <form className="space-y-4 rounded border border-slate-800 bg-slate-950 p-4" onSubmit={save}>
        <h2 className="text-lg font-semibold">Homepage images</h2>
        <p className="text-sm text-slate-300">Ideal dimensions: hero 2000 × 1200 px, all other backgrounds 1800 × 1200 px.</p>
        <p className="text-xs text-slate-400">Each image is shared by route so the homepage and related pages stay in sync.</p>
        {imageFields.map((field) => (
          <label key={field.key} className="block space-y-2 rounded border border-slate-800 bg-slate-950 p-3">
            <span className="text-sm font-medium text-slate-100">{field.label}</span>
            <p className="text-xs text-slate-300">Ideal size: {idealImageDimensions[field.key]}</p>
            <p className="text-xs text-slate-400">Used on: {siteImageUsage[field.key].usedOn.join(", ")}</p>
            <div className="flex h-24 w-36 items-center justify-center overflow-hidden rounded border border-slate-700 bg-slate-900 p-1">
              <Image src={images[field.key]} alt={`${field.label} preview`} width={240} height={160} className="h-full w-full object-contain" />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 file:mr-3 file:rounded file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-black hover:file:bg-slate-200"
                onChange={(event) => uploadImage(field.key, event.target.files?.[0] ?? null)}
              />
              <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-700 bg-slate-900 p-1">
                <Image src={images[field.key]} alt={`${field.label} small preview`} width={120} height={84} className="h-full w-full object-contain" />
              </div>
            </div>
          </label>
        ))}

        <button type="submit" className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200">
          Save image settings
        </button>
        {imageUploadStatus ? <p className="text-sm text-slate-200">{imageUploadStatus}</p> : null}
        {savedMessage ? <p className="text-sm text-green-300">{savedMessage}</p> : null}
      </form>



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
        <button type="button" className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200" onClick={saveDepositSettings}>
          Save deposit settings
        </button>
        {depositStatus ? <p className="text-sm text-slate-200">{depositStatus}</p> : null}
      </section>

      <section className="space-y-4 rounded border border-slate-800 bg-slate-950 p-4">
        <h2 className="text-lg font-semibold">Email server settings</h2>
        <p className="text-sm text-slate-300">Configure outbound email delivery for reminders and marketing campaigns.</p>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-100">
            <span>Provider type</span>
            <input
              type="text"
              className="w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={mailSettings.mailProviderType}
              onChange={(event) => setMailSettings((current) => ({ ...current, mailProviderType: event.target.value }))}
              placeholder="smtp"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>SMTP host</span>
            <input
              type="text"
              className="w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={mailSettings.smtpHost}
              onChange={(event) => setMailSettings((current) => ({ ...current, smtpHost: event.target.value }))}
              placeholder="smtp.example.com"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>SMTP port</span>
            <input
              type="number"
              min={1}
              max={65535}
              className="w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={mailSettings.smtpPort}
              onChange={(event) => setMailSettings((current) => ({ ...current, smtpPort: event.target.value }))}
              placeholder="587"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>SMTP username</span>
            <input
              type="text"
              className="w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={mailSettings.smtpUsername}
              onChange={(event) => setMailSettings((current) => ({ ...current, smtpUsername: event.target.value }))}
            />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>SMTP password</span>
            <input
              type="password"
              className="w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={mailSettings.smtpPassword}
              onChange={(event) => setMailSettings((current) => ({ ...current, smtpPassword: event.target.value }))}
              placeholder={smtpPasswordConfigured ? "Configured (enter new value to replace)" : "Enter SMTP password"}
            />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>Secret reference</span>
            <input
              type="text"
              className="w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={mailSettings.smtpSecretRef}
              onChange={(event) => setMailSettings((current) => ({ ...current, smtpSecretRef: event.target.value }))}
              placeholder="aws-secretsmanager://..."
            />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>From name</span>
            <input
              type="text"
              className="w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={mailSettings.mailFromName}
              onChange={(event) => setMailSettings((current) => ({ ...current, mailFromName: event.target.value }))}
            />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>From email</span>
            <input
              type="email"
              className="w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={mailSettings.mailFromEmail}
              onChange={(event) => setMailSettings((current) => ({ ...current, mailFromEmail: event.target.value }))}
            />
          </label>
          <label className="space-y-1 text-sm text-slate-100 md:col-span-2">
            <span>Reply-to email</span>
            <input
              type="email"
              className="w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={mailSettings.mailReplyTo}
              onChange={(event) => setMailSettings((current) => ({ ...current, mailReplyTo: event.target.value }))}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-100">
            <input
              type="checkbox"
              checked={mailSettings.smtpUseTls}
              onChange={(event) => setMailSettings((current) => ({ ...current, smtpUseTls: event.target.checked }))}
            />
            Use TLS
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-100">
            <input
              type="checkbox"
              checked={mailSettings.smtpUseStarttls}
              onChange={(event) => setMailSettings((current) => ({ ...current, smtpUseStarttls: event.target.checked }))}
            />
            Use STARTTLS
          </label>
        </div>

        <button type="button" className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200" onClick={saveMailSettings}>
          Save email settings
        </button>
        {mailStatus ? <p className="text-sm text-slate-200">{mailStatus}</p> : null}
      </section>

      <section className="space-y-4 rounded border border-slate-800 bg-slate-950 p-4">
        <h2 className="text-lg font-semibold">Admin accounts</h2>
        <p className="text-sm text-slate-300">Create staff, admin, or owner accounts with a temporary password from owner settings.</p>

        <form className="grid gap-3 md:grid-cols-2" onSubmit={createAccount}>
          <label className="space-y-1 text-sm text-slate-100">
            <span>Email</span>
            <input
              type="email"
              className="w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={createAccountForm.email}
              onChange={(event) => setCreateAccountForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>Temporary password</span>
            <input
              type="password"
              minLength={8}
              className="w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={createAccountForm.password}
              onChange={(event) => setCreateAccountForm((current) => ({ ...current, password: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>Role</span>
            <select
              className="w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={createAccountForm.role}
              onChange={(event) => setCreateAccountForm((current) => ({ ...current, role: event.target.value as AccountRole }))}
            >
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
              <option value="OWNER">Owner</option>
            </select>
          </label>

          <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-100">
            <input
              type="checkbox"
              checked={createAccountForm.mustChangePassword}
              onChange={(event) => setCreateAccountForm((current) => ({ ...current, mustChangePassword: event.target.checked }))}
            />
            Require password change on first login
          </label>

          <button type="submit" className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200 md:col-span-2 md:w-fit">
            Create account
          </button>
        </form>

        {createAccountStatus ? <p className="text-sm text-slate-200">{createAccountStatus}</p> : null}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Existing admin users</h3>
          <div className="overflow-x-auto rounded border border-slate-800">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Last login</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-t border-slate-800">
                    <td className="px-3 py-2">{account.email}</td>
                    <td className="px-3 py-2">{account.role}</td>
                    <td className="px-3 py-2">{account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString() : "Never"}</td>
                    <td className="px-3 py-2">{new Date(account.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="rounded border border-red-500 px-2 py-1 text-xs font-medium text-red-200 hover:bg-red-500/10"
                        onClick={() => removeAccount(account)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-slate-400" colSpan={5}>No admin accounts found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
        {accountsStatus ? <p className="text-sm text-slate-200">{accountsStatus}</p> : null}
      </section>


      <section className="space-y-4 rounded border border-slate-800 bg-slate-950 p-4">
        <h2 className="text-lg font-semibold">Blockouts</h2>
        <form onSubmit={createBlockout} className="grid gap-2 rounded border border-slate-800 bg-slate-950 p-4 md:grid-cols-4">
          <input
            type="datetime-local"
            required
            className="rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
            value={newBlockout.startAt}
            onChange={(event) => setNewBlockout((current) => ({ ...current, startAt: event.target.value }))}
          />
          <input
            type="datetime-local"
            required
            className="rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
            value={newBlockout.endAt}
            onChange={(event) => setNewBlockout((current) => ({ ...current, endAt: event.target.value }))}
          />
          <input
            type="text"
            required
            className="rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
            placeholder="Reason"
            value={newBlockout.reason}
            onChange={(event) => setNewBlockout((current) => ({ ...current, reason: event.target.value }))}
          />
          <button type="submit" className="rounded bg-white px-3 py-2 text-sm font-medium text-black hover:bg-slate-200">Add blockout</button>
        </form>

        <ul className="space-y-2">
          {blockouts.map((row) => (
            <li key={row.id} className="grid gap-2 rounded border border-slate-800 bg-slate-950 p-4 md:grid-cols-5 md:items-center">
              <input
                type="datetime-local"
                className="rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
                value={toLocalDatetimeInput(row.startAt)}
                onChange={(event) => setBlockouts((current) => current.map((item) => (item.id === row.id ? { ...item, startAt: toIsoFromLocalInput(event.target.value) } : item)))}
              />
              <input
                type="datetime-local"
                className="rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
                value={toLocalDatetimeInput(row.endAt)}
                onChange={(event) => setBlockouts((current) => current.map((item) => (item.id === row.id ? { ...item, endAt: toIsoFromLocalInput(event.target.value) } : item)))}
              />
              <input
                type="text"
                className="rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
                value={row.reason}
                onChange={(event) => setBlockouts((current) => current.map((item) => (item.id === row.id ? { ...item, reason: event.target.value } : item)))}
              />
              <button type="button" className="rounded bg-white px-3 py-2 text-sm text-black hover:bg-slate-200" onClick={() => updateBlockout(row, {})}>Save</button>
              <button type="button" className="rounded border border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-100 hover:bg-slate-900" onClick={() => deleteBlockout(row.id)}>Delete</button>
            </li>
          ))}
        </ul>
        {blockoutStatus ? <p className="text-sm text-slate-200">{blockoutStatus}</p> : null}
      </section>
    </section>
  );
}
