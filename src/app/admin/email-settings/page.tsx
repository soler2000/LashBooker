"use client";

import { useEffect, useState } from "react";

type AdminSettingsResponse = {
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

export default function AdminEmailSettingsPage() {
  const [mailSettings, setMailSettings] = useState<MailSettingsForm>(defaultMailSettings);
  const [mailStatus, setMailStatus] = useState("");
  const [smtpPasswordConfigured, setSmtpPasswordConfigured] = useState(false);

  const loadMailSettings = async () => {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    if (!response.ok) {
      setMailStatus("Could not load email server settings.");
      return;
    }

    const data = (await response.json()) as AdminSettingsResponse;
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
    setMailStatus("");
  };

  useEffect(() => {
    loadMailSettings();
  }, []);

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

  return (
    <section className="max-w-4xl space-y-10 text-slate-100">
      <div>
        <h1 className="text-2xl font-semibold text-white">Email settings</h1>
        <p className="mt-2 text-sm text-slate-300">Configure outbound email delivery for reminders and marketing campaigns.</p>
      </div>

      <section className="space-y-4 rounded border border-slate-800 bg-slate-950 p-4">
        <h2 className="text-lg font-semibold">Email server settings</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-100">
            <span>Provider type</span>
            <input type="text" className="w-full rounded border border-slate-700 bg-slate-900 p-2" value={mailSettings.mailProviderType} onChange={(event) => setMailSettings((current) => ({ ...current, mailProviderType: event.target.value }))} placeholder="smtp" />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>SMTP host</span>
            <input type="text" className="w-full rounded border border-slate-700 bg-slate-900 p-2" value={mailSettings.smtpHost} onChange={(event) => setMailSettings((current) => ({ ...current, smtpHost: event.target.value }))} placeholder="smtp.example.com" />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>SMTP port</span>
            <input type="number" min={1} max={65535} className="w-full rounded border border-slate-700 bg-slate-900 p-2" value={mailSettings.smtpPort} onChange={(event) => setMailSettings((current) => ({ ...current, smtpPort: event.target.value }))} placeholder="587" />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>SMTP username</span>
            <input type="text" className="w-full rounded border border-slate-700 bg-slate-900 p-2" value={mailSettings.smtpUsername} onChange={(event) => setMailSettings((current) => ({ ...current, smtpUsername: event.target.value }))} />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>SMTP password</span>
            <input type="password" className="w-full rounded border border-slate-700 bg-slate-900 p-2" value={mailSettings.smtpPassword} onChange={(event) => setMailSettings((current) => ({ ...current, smtpPassword: event.target.value }))} placeholder={smtpPasswordConfigured ? "Configured (enter new value to replace)" : "Enter SMTP password"} />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>Secret reference</span>
            <input type="text" className="w-full rounded border border-slate-700 bg-slate-900 p-2" value={mailSettings.smtpSecretRef} onChange={(event) => setMailSettings((current) => ({ ...current, smtpSecretRef: event.target.value }))} placeholder="aws-secretsmanager://..." />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>From name</span>
            <input type="text" className="w-full rounded border border-slate-700 bg-slate-900 p-2" value={mailSettings.mailFromName} onChange={(event) => setMailSettings((current) => ({ ...current, mailFromName: event.target.value }))} />
          </label>
          <label className="space-y-1 text-sm text-slate-100">
            <span>From email</span>
            <input type="email" className="w-full rounded border border-slate-700 bg-slate-900 p-2" value={mailSettings.mailFromEmail} onChange={(event) => setMailSettings((current) => ({ ...current, mailFromEmail: event.target.value }))} />
          </label>
          <label className="space-y-1 text-sm text-slate-100 md:col-span-2">
            <span>Reply-to email</span>
            <input type="email" className="w-full rounded border border-slate-700 bg-slate-900 p-2" value={mailSettings.mailReplyTo} onChange={(event) => setMailSettings((current) => ({ ...current, mailReplyTo: event.target.value }))} />
          </label>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-100">
            <input type="checkbox" checked={mailSettings.smtpUseTls} onChange={(event) => setMailSettings((current) => ({ ...current, smtpUseTls: event.target.checked }))} />
            Use TLS
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-100">
            <input type="checkbox" checked={mailSettings.smtpUseStarttls} onChange={(event) => setMailSettings((current) => ({ ...current, smtpUseStarttls: event.target.checked }))} />
            Use STARTTLS
          </label>
        </div>

        <button type="button" className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200" onClick={saveMailSettings}>
          Save email settings
        </button>
        {mailStatus ? <p className="text-sm text-slate-200">{mailStatus}</p> : null}
      </section>
    </section>
  );
}
