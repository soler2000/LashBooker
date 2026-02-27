"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { VisitorsLocation } from "./types";

const COLORS = ["#38bdf8", "#818cf8", "#34d399", "#f59e0b", "#f87171", "#a78bfa"];

export function LocationDistributionChart({ data }: { data: VisitorsLocation[] }) {
  if (!data.length) {
    return <p className="text-sm text-slate-400">No location data available yet.</p>;
  }

  const topLocations = data.slice(0, 6).map((item) => ({ ...item, label: `${item.country} (${item.region})` }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <BarChart data={topLocations}>
            <XAxis dataKey="country" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "8px" }} />
            <Bar dataKey="visitors" fill="#38bdf8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={topLocations} dataKey="visitors" nameKey="label" outerRadius={90} label>
              {topLocations.map((entry, index) => (
                <Cell key={`${entry.country}-${entry.region}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "8px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
