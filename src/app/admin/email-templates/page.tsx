"use client";

import { useEffect, useMemo, useState } from "react";
import VersionBadge from "@/components/admin/VersionBadge";

type TransactionalEmailTemplate = {
  id: string;
  key: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  allowedPlaceholders: string[];
  allowedUnescapedPlaceholders: string[];
};

type TemplatePreviewResponse = {
  rendered: {
    subject: string;
    htmlBody: string;
    textBody: string;
  };
  sampleVariables: Record<string, string>;
};

export default function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState<TransactionalEmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templatesStatus, setTemplatesStatus] = useState("");
  const [savingTemplateId, setSavingTemplateId] = useState<string | null>(null);
  const [previewingTemplateId, setPreviewingTemplateId] = useState<string | null>(null);
  const [previewByTemplateId, setPreviewByTemplateId] = useState<Record<string, TemplatePreviewResponse>>({});

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const loadTemplates = async () => {
    setTemplatesStatus("");
    const response = await fetch("/api/admin/email-templates", { cache: "no-store" });

    if (!response.ok) {
      setTemplatesStatus("Could not load transactional email templates.");
      return;
    }

    const data = (await response.json()) as TransactionalEmailTemplate[];
    setTemplates(data);
    if (data.length > 0) {
      setSelectedTemplateId((current) => current || data[0].id);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const updateTemplateValue = (
    id: string,
    field: "subject" | "htmlBody" | "textBody" | "isActive",
    value: string | boolean,
  ) => {
    setTemplates((current) =>
      current.map((template) =>
        template.id === id
          ? {
              ...template,
              [field]: value,
            }
          : template,
      ),
    );
  };

  const saveTemplate = async (id: string) => {
    const template = templates.find((item) => item.id === id);
    if (!template) {
      return;
    }

    setSavingTemplateId(id);
    setTemplatesStatus("");

    const response = await fetch(`/api/admin/email-templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
        isActive: template.isActive,
      }),
    });

    setSavingTemplateId(null);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string; details?: string[] };
      const details = data.details ? ` ${data.details.join(" ")}` : "";
      setTemplatesStatus((data.error ?? `Could not save ${template.name}.`) + details);
      return;
    }

    const updated = (await response.json()) as TransactionalEmailTemplate;
    setTemplates((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setTemplatesStatus(`Saved “${updated.name}”.`);
  };

  const previewTemplate = async (id: string) => {
    const template = templates.find((item) => item.id === id);
    if (!template) return;

    setPreviewingTemplateId(id);
    setTemplatesStatus("");

    const response = await fetch(`/api/admin/email-templates/${id}/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
      }),
    });

    setPreviewingTemplateId(null);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string; details?: string[] };
      const details = data.details ? ` ${data.details.join(" ")}` : "";
      setTemplatesStatus((data.error ?? `Could not preview ${template.name}.`) + details);
      return;
    }

    const preview = (await response.json()) as TemplatePreviewResponse;
    setPreviewByTemplateId((current) => ({ ...current, [id]: preview }));
    setTemplatesStatus(`Preview rendered for “${template.name}”.`);
  };

  const preview = selectedTemplate ? previewByTemplateId[selectedTemplate.id] : null;

  return (
    <section className="max-w-4xl space-y-4 rounded border border-slate-800 bg-slate-950 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Transactional email templates</h1>
        <VersionBadge />
        <p className="w-full text-sm text-slate-300">
          Select a template from the dropdown, then edit subject and body content for customer notifications.
        </p>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-200">Template</span>
        <select
          className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          value={selectedTemplateId}
          onChange={(event) => setSelectedTemplateId(event.target.value)}
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </label>

      {selectedTemplate ? (
        <article className="space-y-3 rounded border border-slate-800 bg-slate-900/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">{selectedTemplate.name}</h2>
              <p className="text-xs text-slate-400">Key: {selectedTemplate.key}</p>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={selectedTemplate.isActive}
                onChange={(event) => updateTemplateValue(selectedTemplate.id, "isActive", event.target.checked)}
              />
              Active
            </label>
          </div>

          <p className="text-xs text-slate-400">
            Allowed placeholders: {selectedTemplate.allowedPlaceholders.map((token) => `{{${token}}}`).join(", ")}
          </p>

          <label className="block space-y-1">
            <span className="text-xs text-slate-300">Subject</span>
            <input
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={selectedTemplate.subject}
              onChange={(event) => updateTemplateValue(selectedTemplate.id, "subject", event.target.value)}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-slate-300">HTML body</span>
            <textarea
              className="h-32 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={selectedTemplate.htmlBody}
              onChange={(event) => updateTemplateValue(selectedTemplate.id, "htmlBody", event.target.value)}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-slate-300">Plain text body</span>
            <textarea
              className="h-28 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={selectedTemplate.textBody}
              onChange={(event) => updateTemplateValue(selectedTemplate.id, "textBody", event.target.value)}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={savingTemplateId === selectedTemplate.id}
              onClick={() => saveTemplate(selectedTemplate.id)}
            >
              {savingTemplateId === selectedTemplate.id ? "Saving..." : "Save template"}
            </button>
            <button
              type="button"
              className="rounded border border-slate-400 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={previewingTemplateId === selectedTemplate.id}
              onClick={() => previewTemplate(selectedTemplate.id)}
            >
              {previewingTemplateId === selectedTemplate.id ? "Rendering preview..." : "Preview"}
            </button>
          </div>

          {preview ? (
            <div className="space-y-2 rounded border border-slate-700 bg-slate-950 p-3">
              <p className="text-xs text-slate-300">Preview subject: {preview.rendered.subject}</p>
              <p className="text-xs text-slate-400">Sample data: {JSON.stringify(preview.sampleVariables)}</p>
              <p className="text-xs text-slate-300">Preview text:</p>
              <pre className="whitespace-pre-wrap rounded bg-slate-900 p-2 text-xs text-slate-200">
                {preview.rendered.textBody}
              </pre>
              <p className="text-xs text-slate-300">Preview HTML:</p>
              <div className="rounded bg-white p-3 text-black" dangerouslySetInnerHTML={{ __html: preview.rendered.htmlBody }} />
            </div>
          ) : null}
        </article>
      ) : null}

      {templatesStatus ? <p className="text-sm text-slate-200">{templatesStatus}</p> : null}
    </section>
  );
}
