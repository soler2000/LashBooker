"use client";

import { FormEvent, useEffect, useState } from "react";
import VersionBadge from "@/components/admin/VersionBadge";

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

export default function AdminAccountsPage() {
  const [createAccountForm, setCreateAccountForm] = useState<CreateAccountForm>(defaultCreateAccountForm);
  const [createAccountStatus, setCreateAccountStatus] = useState("");
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [accountsStatus, setAccountsStatus] = useState("");

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
    loadAccounts();
  }, []);

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
    <section className="max-w-4xl space-y-6 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Admin accounts</h1>
        <VersionBadge />
        <p className="mt-2 w-full text-sm text-slate-300">Create staff, admin, or owner accounts and manage password resets.</p>
      </div>

      <section className="space-y-4 rounded border border-slate-800 bg-slate-950 p-4">
        <h2 className="text-lg font-semibold">Create account</h2>
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
      </section>

      <section className="space-y-2 rounded border border-slate-800 bg-slate-950 p-4">
        <h2 className="text-lg font-semibold">Existing admin users</h2>
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
        {accountsStatus ? <p className="text-sm text-slate-200">{accountsStatus}</p> : null}
      </section>
    </section>
  );
}
