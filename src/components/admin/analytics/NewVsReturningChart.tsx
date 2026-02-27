"use client";

import type { VisitorsSeriesPoint } from "./types";

export function NewVsReturningChart({
  series,
  newVisitors,
  returningVisitors,
}: {
  series: VisitorsSeriesPoint[];
  newVisitors: number;
  returningVisitors: number;
}) {
  const total = newVisitors + returningVisitors;

  if (!series.length || total === 0) {
    return <p className="text-sm text-slate-400">No visitor segmentation data available for charting.</p>;
  }

  const newPercent = Math.round((newVisitors / total) * 100);
  const returningPercent = Math.max(0, 100 - newPercent);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded bg-slate-800">
        <div className="flex h-6">
          <div className="bg-green-500" style={{ width: `${newPercent}%` }} />
          <div className="bg-purple-500" style={{ width: `${returningPercent}%` }} />
        </div>
      </div>
      <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
        <p>New visitors: {newVisitors.toLocaleString()} ({newPercent}%)</p>
        <p>Returning visitors: {returningVisitors.toLocaleString()} ({returningPercent}%)</p>
      </div>
    </div>
  );
}
