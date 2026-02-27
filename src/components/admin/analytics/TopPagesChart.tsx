"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { VisitorsTopPage } from "./types";

export function TopPagesChart({ data }: { data: VisitorsTopPage[] }) {
  if (!data.length) {
    return <p className="text-sm text-slate-400">No page-view data available for this period.</p>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis type="number" stroke="#94a3b8" allowDecimals={false} />
          <YAxis type="category" width={220} dataKey="path" stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "8px" }} />
          <Bar dataKey="visits" fill="#34d399" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
