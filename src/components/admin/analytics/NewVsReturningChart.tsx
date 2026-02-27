"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { VisitorsSeriesPoint } from "./types";

function formatPeriod(value: string) {
  return new Date(value).toLocaleDateString();
}

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
  const ratioSeries = series.map((point) => ({
    ...point,
    newVisitors: total === 0 ? 0 : Math.round((point.visitors * newVisitors) / total),
    returningVisitors: total === 0 ? 0 : Math.max(point.visitors - Math.round((point.visitors * newVisitors) / total), 0),
  }));

  if (!ratioSeries.length) {
    return <p className="text-sm text-slate-400">No visitor segmentation data available for charting.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={ratioSeries}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="periodStart" tickFormatter={formatPeriod} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "8px" }}
            labelFormatter={(label: string | number) => formatPeriod(String(label))}
          />
          <Area type="monotone" dataKey="newVisitors" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.4} name="New" />
          <Area
            type="monotone"
            dataKey="returningVisitors"
            stackId="1"
            stroke="#a855f7"
            fill="#a855f7"
            fillOpacity={0.4}
            name="Returning"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
