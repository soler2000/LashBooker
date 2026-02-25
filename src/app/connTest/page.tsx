"use client";

import { FormEvent, useMemo, useState } from "react";

type TestResult = {
  success: boolean;
  elapsedMs?: number;
  usedConnectionString?: string;
  message?: string;
  error?: string;
};

type FormState = {
  connectionString: string;
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  sslMode: "disable" | "prefer" | "require";
};

const initialState: FormState = {
  connectionString: "",
  host: "",
  port: "5432",
  database: "",
  user: "",
  password: "",
  sslMode: "require",
};

export default function ConnectionTestPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const composedPreview = useMemo(() => {
    if (!form.host || !form.port || !form.database || !form.user) return "";

    const safeUser = encodeURIComponent(form.user);
    const maskedPassword = form.password ? "********" : "<password>";

    return `postgresql://${safeUser}:${maskedPassword}@${form.host}:${form.port}/${form.database}?sslmode=${form.sslMode}`;
  }, [form]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch("/api/health/database/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as TestResult;
      setResult(payload);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unexpected network error",
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Database Connection Troubleshooting</h1>
        <p className="mt-2 text-sm text-gray-600">
          Use this page to test new credentials safely without restarting the app.
        </p>
      </div>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-semibold">Step-by-step checklist</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>Try your current production connection string first to capture the exact error message.</li>
          <li>If it fails, switch to host/port/database/user/password fields and verify each value independently.</li>
          <li>Toggle SSL mode (require, prefer, disable) based on your provider&apos;s requirement.</li>
          <li>Confirm your database user can run <code>SELECT 1</code> and has access to the target database.</li>
          <li>
            Once this page reports success, copy the same values into your environment variables
            (<code>DATABASE_URL</code>, <code>POSTGRES_*</code>, etc.) and redeploy.
          </li>
        </ol>
      </section>

      <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-semibold">Connection Test</h2>
        <p className="mt-1 text-sm text-gray-600">
          You can either paste a full connection string OR use the individual fields.
        </p>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium" htmlFor="connectionString">
            Full connection string
          </label>
          <textarea
            id="connectionString"
            className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="postgresql://user:password@host:5432/dbname?sslmode=require"
            value={form.connectionString}
            onChange={(event) => setForm((prev) => ({ ...prev, connectionString: event.target.value }))}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            ["host", "Host", form.host],
            ["port", "Port", form.port],
            ["database", "Database", form.database],
            ["user", "Username", form.user],
          ].map(([key, label, value]) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium" htmlFor={key}>
                {label}
              </label>
              <input
                id={key}
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={value}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    [key]: event.target.value,
                  }))
                }
              />
            </div>
          ))}

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="sslMode">
              SSL Mode
            </label>
            <select
              id="sslMode"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.sslMode}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  sslMode: event.target.value as FormState["sslMode"],
                }))
              }
            >
              <option value="require">require</option>
              <option value="prefer">prefer</option>
              <option value="disable">disable</option>
            </select>
          </div>
        </div>

        <div className="mt-4 rounded-md bg-gray-50 p-3 text-xs text-gray-700">
          <p className="font-semibold">Preview (masked):</p>
          <p className="mt-1 break-all">{composedPreview || "Fill host/port/database/user to preview."}</p>
        </div>

        <button
          type="submit"
          disabled={testing}
          className="mt-4 rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {testing ? "Testing..." : "Run connection test"}
        </button>
      </form>

      {result && (
        <section
          className={`rounded-lg border p-4 ${
            result.success ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
          }`}
        >
          <h2 className="text-lg font-semibold">Last Result</h2>
          <p className="mt-2 text-sm">
            <strong>Status:</strong> {result.success ? "Success" : "Failed"}
          </p>
          {typeof result.elapsedMs === "number" && (
            <p className="text-sm">
              <strong>Response Time:</strong> {result.elapsedMs}ms
            </p>
          )}
          {result.usedConnectionString && (
            <p className="mt-1 break-all text-sm">
              <strong>Connection Used:</strong> {result.usedConnectionString}
            </p>
          )}
          {result.message && <p className="mt-1 text-sm text-green-900">{result.message}</p>}
          {result.error && <p className="mt-1 text-sm text-red-900">{result.error}</p>}
        </section>
      )}
    </main>
  );
}
