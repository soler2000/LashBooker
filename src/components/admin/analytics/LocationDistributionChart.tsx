"use client";

import type { VisitorsLocation } from "./types";

export function LocationDistributionChart({ data }: { data: VisitorsLocation[] }) {
  if (!data.length) {
    return <p className="text-sm text-slate-400">No location data available yet.</p>;
  }

  const topLocations = data.slice(0, 8);
  const totalVisitors = topLocations.reduce((sum, location) => sum + location.visitors, 0) || 1;

  return (
    <ul className="space-y-3">
      {topLocations.map((location) => {
        const percentage = Math.round((location.visitors / totalVisitors) * 100);
        return (
          <li key={`${location.country}-${location.region}`} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{location.country} ({location.region})</span>
              <span>{location.visitors.toLocaleString()} · {percentage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-slate-800">
              <div className="h-full rounded bg-cyan-400" style={{ width: `${percentage}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
