"use client";

import type { VisitorsSeriesPoint } from "./types";

function formatPeriod(value: string) {
  return new Date(value).toLocaleDateString();
}

export function VisitorsOverTimeChart({ data }: { data: VisitorsSeriesPoint[] }) {
  if (!data.length) {
    return <p className="text-sm text-slate-400">No visitor time-series data available for this date range.</p>;
  }

  const maxValue = Math.max(...data.map((point) => Math.max(point.visitors, point.pageViews)), 1);

  return (
    <div className="space-y-3">
      {data.map((point) => (
        <div key={point.periodStart} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>{formatPeriod(point.periodStart)}</span>
            <span>{point.visitors} visitors · {point.pageViews} views</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-slate-800">
            <div className="h-full bg-sky-400" style={{ width: `${(point.visitors / maxValue) * 100}%` }} />
          </div>
          <div className="h-2 overflow-hidden rounded bg-slate-800">
            <div className="h-full bg-violet-400" style={{ width: `${(point.pageViews / maxValue) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
