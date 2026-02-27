"use client";

import type { VisitorsTopPage } from "./types";

export function TopPagesChart({ data }: { data: VisitorsTopPage[] }) {
  if (!data.length) {
    return <p className="text-sm text-slate-400">No page-view data available for this period.</p>;
  }

  const maxVisits = Math.max(...data.map((item) => item.visits), 1);

  return (
    <ul className="space-y-3">
      {data.map((item) => (
        <li key={item.path} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
            <span className="truncate">{item.path}</span>
            <span>{item.visits.toLocaleString()}</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-slate-800">
            <div className="h-full rounded bg-emerald-400" style={{ width: `${(item.visits / maxVisits) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
