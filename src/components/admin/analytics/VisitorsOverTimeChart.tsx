"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { VisitorsSeriesPoint } from "./types";

function formatPeriod(value: string) {
  return new Date(value).toLocaleDateString();
}

export function VisitorsOverTimeChart({ data }: { data: VisitorsSeriesPoint[] }) {
  if (!data.length) {
    return <p className="text-sm text-slate-400">No visitor time-series data available for this date range.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="periodStart" tickFormatter={formatPeriod} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "8px" }}
            labelFormatter={(label: string | number) => formatPeriod(String(label))}
          />
          <Legend />
          <Line type="monotone" dataKey="visitors" stroke="#38bdf8" strokeWidth={2} dot={false} name="Visitors" />
          <Line type="monotone" dataKey="pageViews" stroke="#a78bfa" strokeWidth={2} dot={false} name="Page Views" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
