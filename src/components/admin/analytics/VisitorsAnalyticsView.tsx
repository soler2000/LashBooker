"use client";

import { useEffect, useMemo, useState } from "react";
import { AnalyticsCard } from "./AnalyticsCard";
import { KpiCard } from "./KpiCard";
import { LocationDistributionChart } from "./LocationDistributionChart";
import { NewVsReturningChart } from "./NewVsReturningChart";
import { TopPagesChart } from "./TopPagesChart";
import type { VisitorsReportPayload } from "./types";
import { VisitorsOverTimeChart } from "./VisitorsOverTimeChart";

function secondsToTimeLabel(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}m ${seconds}s`;
}

function getDefaultRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString(), granularity: "day" as const };
}

export default function VisitorsAnalyticsView() {
  const [data, setData] = useState<VisitorsReportPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const query = useMemo(() => {
    const range = getDefaultRange();
    return new URLSearchParams(range).toString();
  }, []);

  useEffect(() => {
    const load = async () => {
      setStatus("loading");
      const response = await fetch(`/api/admin/reports/visitors?${query}`, { cache: "no-store" });
      if (!response.ok) {
        setStatus("error");
        return;
      }

      const payload = (await response.json()) as VisitorsReportPayload;
      setData(payload);
      setStatus("ready");
    };

    load();
  }, [query]);

  return (
    <section className="space-y-6 text-slate-100">
      <div>
        <h1 className="text-2xl font-semibold text-white">Visitor Analytics</h1>
        <p className="mt-1 text-sm text-slate-300">Traffic trends, engagement, and audience profile for the last 30 days.</p>
      </div>

      {status === "loading" ? <p className="text-sm text-slate-300">Loading visitor analytics...</p> : null}
      {status === "error" ? (
        <div className="rounded border border-red-700/50 bg-red-950/40 p-4 text-sm text-red-200">Unable to load visitor analytics data.</div>
      ) : null}

      {status === "ready" && data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard label="Unique visitors" value={data.uniqueVisitors.toLocaleString()} />
            <KpiCard label="New visitors" value={data.newVisitors.toLocaleString()} />
            <KpiCard label="Returning visitors" value={data.returningVisitors.toLocaleString()} />
            <KpiCard label="Avg time on site" value={secondsToTimeLabel(data.avgTimeOnSiteSeconds)} />
            <KpiCard
              label="Total page views"
              value={data.series.reduce((sum, point) => sum + point.pageViews, 0).toLocaleString()}
            />
          </div>

          {data.series.length === 0 ? (
            <div className="rounded border border-slate-800 bg-slate-950 p-6 text-sm text-slate-300">
              No visitor activity found for the selected period.
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <AnalyticsCard title="Visitors over time">
              <VisitorsOverTimeChart data={data.series} />
            </AnalyticsCard>

            <AnalyticsCard title="New vs returning visitors">
              <NewVsReturningChart
                series={data.series}
                newVisitors={data.newVisitors}
                returningVisitors={data.returningVisitors}
              />
            </AnalyticsCard>

            <AnalyticsCard title="Top pages">
              <TopPagesChart data={data.topPages} />
            </AnalyticsCard>

            <AnalyticsCard title="Location distribution">
              <LocationDistributionChart data={data.locationBreakdown} />
            </AnalyticsCard>
          </div>
        </>
      ) : null}
    </section>
  );
}
