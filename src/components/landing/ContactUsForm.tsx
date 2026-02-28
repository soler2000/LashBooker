"use client";

import { FormEvent, useState } from "react";

type ContactFormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const initialState: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

export default function ContactUsForm() {
  const [form, setForm] = useState<ContactFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setStatus({
          type: "error",
          message: payload.error || "We could not send your message right now. Please try again.",
        });
        return;
      }

      setForm(initialState);
      setStatus({
        type: "success",
        message: "Thank you — your message has been sent. We'll be in touch soon.",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Network error. Please try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact-us" className="mx-auto w-full max-w-3xl rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-white/65">Contact us</p>
        <h2 className="text-3xl font-semibold md:text-5xl">Questions before you book?</h2>
        <p className="text-white/75">Send us a message and we&apos;ll reply with availability, prep guidance, or service recommendations.</p>
      </div>

      <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
        <input
          required
          className="rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-white/45 focus:outline-none"
          placeholder="Your name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
        <input
          required
          type="email"
          className="rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-white/45 focus:outline-none"
          placeholder="Your email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
        <input
          className="rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-white/45 focus:outline-none"
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
        />
        <textarea
          required
          rows={5}
          className="rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-white/45 focus:outline-none"
          placeholder="How can we help?"
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 inline-flex w-fit rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition enabled:hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Sending..." : "Send message"}
        </button>

        {status ? (
          <p className={status.type === "success" ? "text-sm text-emerald-300" : "text-sm text-rose-300"}>{status.message}</p>
        ) : null}
      </form>
    </section>
  );
}
