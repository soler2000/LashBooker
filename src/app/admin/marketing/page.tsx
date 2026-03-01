"use client";

import { useEffect, useMemo, useState } from "react";

type SegmentType = "lapsed" | "vip" | "infill-due";

type Campaign = {
  id: string;
  name: string;
  subject: string;
  segmentType: string;
  status: string;
  sentAt: string | null;
  _count?: { recipients: number };
};

const segmentOptions: Array<{ label: string; value: SegmentType }> = [
  { label: "Lapsed", value: "lapsed" },
  { label: "VIP", value: "vip" },
  { label: "Infill due", value: "infill-due" },
];

export default function MarketingPage() {
  const [segmentType, setSegmentType] = useState<SegmentType>("lapsed");
  const [segmentCount, setSegmentCount] = useState<number>(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<p>We miss you! Book your next appointment today.</p>");
  const [loading, setLoading] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [status, setStatus] = useState("");

  const normalizeInstagramInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const selectedSegmentLabel = useMemo(
    () => segmentOptions.find((s) => s.value === segmentType)?.label ?? segmentType,
    [segmentType],
  );

  async function loadCampaigns() {
    const res = await fetch("/api/admin/campaigns");
    if (!res.ok) return;
    const data = await res.json();
    setCampaigns(data.campaigns ?? []);
  }

  async function loadInstagram() {
    const res = await fetch("/api/admin/settings", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setInstagramUrl(data.instagramUrl ?? "");
  }

  async function loadSegment(type: SegmentType) {
    const res = await fetch(`/api/admin/segments/${type}`);
    if (!res.ok) return;
    const data = await res.json();
    setSegmentCount(data.count ?? 0);
  }

  useEffect(() => {
    loadCampaigns();
    loadInstagram();
  }, []);

  useEffect(() => {
    loadSegment(segmentType);
  }, [segmentType]);

  async function createCampaign() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject, bodyHtml, segmentType }),
      });
      if (!res.ok) return;
      setName("");
      setSubject("");
      await loadCampaigns();
    } finally {
      setLoading(false);
    }
  }

  async function sendCampaign(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/send`, { method: "POST" });
      if (!res.ok) return;
      await loadCampaigns();
      await loadSegment(segmentType);
    } finally {
      setLoading(false);
    }
  }

  async function saveInstagram() {
    setStatus("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instagramUrl: normalizeInstagramInput(instagramUrl) || null,
      }),
    });

    if (!res.ok) {
      setStatus("Could not save Instagram URL.");
      return;
    }

    setStatus("Instagram URL saved.");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Marketing</h1>
        <p className="mt-1 text-sm text-slate-600">
          Build and send segmented campaigns to consented clients.
        </p>
      </div>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Instagram</h2>
        <p className="mt-1 text-sm text-slate-600">Set the Instagram profile URL shown on the website header.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="space-y-1 text-sm text-slate-700">
            <span>Instagram profile URL</span>
            <input
              type="url"
              placeholder="https://instagram.com/yourhandle"
              className="w-full rounded border px-3 py-2"
              value={instagramUrl}
              onChange={(event) => setInstagramUrl(event.target.value)}
            />
          </label>
          <button className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60" disabled={loading} onClick={saveInstagram}>
            Save Instagram
          </button>
        </div>
        {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Create campaign</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="rounded border px-3 py-2" placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <select className="rounded border px-3 py-2" value={segmentType} onChange={(e) => setSegmentType(e.target.value as SegmentType)}>
            {segmentOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <div className="flex items-center text-sm text-slate-600">
            Eligible recipients for {selectedSegmentLabel}: <strong className="ml-1">{segmentCount}</strong>
          </div>
        </div>
        <textarea className="mt-3 min-h-36 w-full rounded border px-3 py-2 font-mono text-sm" value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} />
        <button className="mt-3 rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60" disabled={loading || !name || !subject || !bodyHtml} onClick={createCampaign}>
          Create campaign
        </button>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Campaigns</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-600">
                <th className="py-2">Name</th>
                <th className="py-2">Segment</th>
                <th className="py-2">Status</th>
                <th className="py-2">Recipients</th>
                <th className="py-2">Sent</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b">
                  <td className="py-2">{campaign.name}</td>
                  <td className="py-2">{campaign.segmentType}</td>
                  <td className="py-2">{campaign.status}</td>
                  <td className="py-2">{campaign._count?.recipients ?? 0}</td>
                  <td className="py-2">{campaign.sentAt ? new Date(campaign.sentAt).toLocaleString() : "-"}</td>
                  <td className="py-2 text-right">
                    <button
                      className="rounded border px-3 py-1 disabled:opacity-60"
                      disabled={loading || campaign.status === "SENDING"}
                      onClick={() => sendCampaign(campaign.id)}
                    >
                      Send
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
