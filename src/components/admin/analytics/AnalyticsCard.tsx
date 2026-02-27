import type { ReactNode } from "react";

export function AnalyticsCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded border border-slate-800 bg-slate-950 p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">{title}</h2>
      {children}
    </section>
  );
}
