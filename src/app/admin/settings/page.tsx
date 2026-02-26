"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { defaultSiteImages, SITE_IMAGES_STORAGE_KEY, siteImageUsage, type SiteImageKey, type SiteImages } from "@/lib/site-images";

type AdminSettingsResponse = {
  depositRequired: boolean;
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

const defaultCreateAccountForm: CreateAccountForm = {
  email: "",
  password: "",
  role: "STAFF",
  mustChangePassword: true,
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

  const [depositRequired, setDepositRequired] = useState(true);
  const [depositStatus, setDepositStatus] = useState("");
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

  const loadDepositSettings = async () => {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    if (!response.ok) {
      setDepositStatus("Could not load deposit settings.");
      return;
    }

    const data = (await response.json()) as AdminSettingsResponse;
    setDepositRequired(data.depositRequired);
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

  const resetAccountPassword = async (account: AdminAccount) => {
    const password = window.prompt(`Set a new temporary password for ${account.email}.`);
    if (!password) {
      return;
    }

    setAccountsStatus("");
    const response = await fetch(`/api/admin/accounts/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setAccountsStatus(data.error ?? "Could not reset password.");
      return;
    }

    setAccountsStatus(`Password reset for ${account.email}. They will be prompted to change it on next login.`);
    await loadAccounts();
  };

  return (
    <section className="max-w-4xl space-y-10 text-slate-100">
      <div>
        <h1 className="text-2xl font-semibold text-white">Owner settings</h1>
        <p className="mt-2 text-sm text-slate-300">Upload homepage background images, manage deposit requirements, and maintain admin access.</p>
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
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded border border-slate-600 px-2 py-1 text-xs font-medium text-slate-100 hover:bg-slate-900"
                          onClick={() => resetAccountPassword(account)}
                        >
                          Reset password
                        </button>
                        <button
                          type="button"
                          className="rounded border border-red-500 px-2 py-1 text-xs font-medium text-red-200 hover:bg-red-500/10"
                          onClick={() => removeAccount(account)}
                        >
                          Remove
                        </button>
                      </div>
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
    </section>
  );
}
