"use client";

import { useEffect, useState } from "react";

type TransactionalEmailLog = {
  id: string;
  templateKey: string;
  recipientEmail: string;
  recipientUserId: string | null;
  bookingId: string | null;
  dedupeKey: string | null;
  status: "QUEUED" | "SENT" | "FAILED";
  providerMessageId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function EmailDiagnosticsPage() {
  const [logs, setLogs] = useState<TransactionalEmailLog[]>([]);
  const [statusMessage, setStatusMessage] = useState("Loading...");

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/admin/transactional-email-logs", { cache: "no-store" });
      if (!response.ok) {
        setStatusMessage("Could not load transactional email logs.");
        return;
      }

      const data = (await response.json()) as TransactionalEmailLog[];
      setLogs(data);
      setStatusMessage(data.length ? "" : "No transactional email logs yet.");
    };

    load();
  }, []);

  return (
    <section className="space-y-4 text-slate-100">
      <div>
        <h1 className="text-2xl font-semibold text-white">Transactional email diagnostics</h1>
        <p className="mt-1 text-sm text-slate-300">Latest reminder and system email sends (read-only).</p>
      </div>

      {statusMessage ? <p className="text-sm text-slate-300">{statusMessage}</p> : null}

      {logs.length ? (
        <div className="overflow-x-auto rounded border border-slate-800 bg-slate-950">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-300">
              <tr>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Template</th>
                <th className="px-3 py-2">Recipient</th>
                <th className="px-3 py-2">Booking</th>
                <th className="px-3 py-2">Dedupe key</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Provider message ID</th>
                <th className="px-3 py-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-900 align-top">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{log.templateKey}</td>
                  <td className="px-3 py-2">{log.recipientEmail}</td>
                  <td className="px-3 py-2">{log.bookingId ?? "—"}</td>
                  <td className="px-3 py-2">{log.dedupeKey ?? "—"}</td>
                  <td className="px-3 py-2">{log.status}</td>
                  <td className="px-3 py-2">{log.providerMessageId ?? "—"}</td>
                  <td className="px-3 py-2">{log.error ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
