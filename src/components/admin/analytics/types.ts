export type VisitorsSeriesPoint = {
  periodStart: string;
  visitors: number;
  pageViews: number;
  avgSessionDurationSeconds: number;
};

export type VisitorsTopPage = {
  path: string;
  visits: number;
};

export type VisitorsLocation = {
  country: string;
  region: string;
  visitors: number;
};

export type VisitorsReportPayload = {
  uniqueVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  avgTimeOnSiteSeconds: number;
  topPages: VisitorsTopPage[];
  locationBreakdown: VisitorsLocation[];
  series: VisitorsSeriesPoint[];
  from: string;
  to: string;
  granularity: "day" | "week" | "month";
};
