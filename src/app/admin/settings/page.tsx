"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import {
  defaultSiteImages,
  SITE_IMAGES_STORAGE_KEY,
  siteImageUsage,
  type SiteImageKey,
  type SiteImages,
} from "@/lib/site-images";

type AdminSettingsResponse = {
  depositRequired: boolean;
};

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

const imageFields: Array<{ key: SiteImageKey; label: string }> = (
  Object.keys(defaultSiteImages) as SiteImageKey[]
).map((key) => ({
  key,
  label: siteImageUsage[key].label,
}));

const idealImageDimensions: Record<SiteImageKey, string> = {
  hero: "2000 × 1200 px",
  precision: "1800 × 1200 px",
  closeup: "1800 × 1200 px",
  luxury: "1800 × 1200 px",
  booking: "1800 × 1200 px",
  policies: "1800 × 1200 px",
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

export default function AdminSettingsPage() {
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const [savedMessage, setSavedMessage] = useState("");
  const [imageUploadStatus, setImageUploadStatus] = useState("");

  const [depositRequired, setDepositRequired] = useState(true);
  const [depositStatus, setDepositStatus] = useState("");

  const [templates, setTemplates] = useState<TransactionalEmailTemplate[]>([]);
  const [templatesStatus, setTemplatesStatus] = useState("");
  const [savingTemplateId, setSavingTemplateId] = useState<string | null>(null);
  const [previewingTemplateId, setPreviewingTemplateId] = useState<string | null>(null);
  const [previewByTemplateId, setPreviewByTemplateId] = useState<Record<string, TemplatePreviewResponse>>({});

  useEffect(() => {
    const stored = window.localStorage.getItem(SITE_IMAGES_STORAGE_KEY);

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<SiteImages>;
      setImages({ ...defaultSiteImages, ...parsed });
    } catch {
      setImages(defaultSiteImages);
    }
  }, []);

  const loadDepositSettings = async () => {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    if (!response.ok) {
      setDepositStatus("Could not load deposit settings.");
      return;
    }

    const data = (await response.json()) as AdminSettingsResponse;
    setDepositRequired(data.depositRequired);
  };

  const loadTemplates = async () => {
    setTemplatesStatus("");
    const response = await fetch("/api/admin/email-templates", { cache: "no-store" });

    if (!response.ok) {
      setTemplatesStatus("Could not load transactional email templates.");
      return;
    }

    const data = (await response.json()) as TransactionalEmailTemplate[];
    setTemplates(data);
  };

  useEffect(() => {
    loadDepositSettings();
    loadTemplates();
  }, []);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.localStorage.setItem(SITE_IMAGES_STORAGE_KEY, JSON.stringify(images));
    setSavedMessage("Saved. Refresh the front page to see updates.");
  };

  const uploadImage = async (key: SiteImageKey, file: File | null) => {
    if (!file) {
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setImages((current) => ({ ...current, [key]: dataUrl }));
      setImageUploadStatus(
        `${imageFields.find((field) => field.key === key)?.label ?? "Image"} uploaded. Click save to apply.`,
      );
    } catch {
      setImageUploadStatus("Could not upload image. Please try a different file.");
    }
  };

  const saveDepositSettings = async () => {
    setDepositStatus("");
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositRequired }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setDepositStatus(data.error ?? "Could not save deposit settings.");
      return;
    }

    setDepositStatus(
      depositRequired
        ? "Deposits are required for new bookings."
        : "Deposits are disabled. Bookings confirm immediately.",
    );
  };

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

  return (
    <section className="max-w-4xl space-y-10 text-slate-100">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
      </div>

      <form onSubmit={save} className="space-y-4 rounded border border-slate-800 bg-slate-950 p-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Landing page images</h2>
          <p className="text-sm text-slate-300">Upload custom images for key sections on the public site.</p>
        </div>

        {imageFields.map((field) => (
          <label key={field.key} className="block space-y-2 rounded border border-slate-800 bg-slate-900/30 p-3">
            <span className="text-sm font-medium text-slate-100">{field.label}</span>
            <p className="text-xs text-slate-300">Ideal size: {idealImageDimensions[field.key]}</p>
            <p className="text-xs text-slate-400">Used on: {siteImageUsage[field.key].usedOn.join(", ")}</p>
            <div className="flex h-24 w-36 items-center justify-center overflow-hidden rounded border border-slate-700 bg-slate-900 p-1">
              <Image
                src={images[field.key]}
                alt={`${field.label} preview`}
                width={240}
                height={160}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 file:mr-3 file:rounded file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-black hover:file:bg-slate-200"
                onChange={(event) => uploadImage(field.key, event.target.files?.[0] ?? null)}
              />
              <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-700 bg-slate-900 p-1">
                <Image
                  src={images[field.key]}
                  alt={`${field.label} small preview`}
                  width={120}
                  height={84}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </label>
        ))}

        <button
          type="submit"
          className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200"
        >
          Save image settings
        </button>
        {imageUploadStatus ? <p className="text-sm text-slate-200">{imageUploadStatus}</p> : null}
        {savedMessage ? <p className="text-sm text-green-300">{savedMessage}</p> : null}
      </form>

      <section className="space-y-4 rounded border border-slate-800 bg-slate-950 p-4">
        <h2 className="text-lg font-semibold">Booking deposits</h2>
        <p className="text-sm text-slate-300">
          Choose whether clients must pay a Stripe deposit before a booking is confirmed.
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-100">
          <input
            type="checkbox"
            checked={depositRequired}
            onChange={(event) => setDepositRequired(event.target.checked)}
          />
          Require deposit payment for new bookings
        </label>
        <button
          type="button"
          className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200"
          onClick={saveDepositSettings}
        >
          Save deposit settings
        </button>
        {depositStatus ? <p className="text-sm text-slate-200">{depositStatus}</p> : null}
      </section>

      <section className="space-y-4 rounded border border-slate-800 bg-slate-950 p-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Transactional email templates</h2>
          <p className="text-sm text-slate-300">
            Edit subject and body content for customer notifications. Variables in <code>{"{{token}}"}</code> are escaped by
            default.
          </p>
        </div>

        <div className="space-y-4">
          {templates.map((template) => {
            const preview = previewByTemplateId[template.id];
            return (
              <article key={template.id} className="space-y-3 rounded border border-slate-800 bg-slate-900/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{template.name}</h3>
                    <p className="text-xs text-slate-400">Key: {template.key}</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-200">
                    <input
                      type="checkbox"
                      checked={template.isActive}
                      onChange={(event) => updateTemplateValue(template.id, "isActive", event.target.checked)}
                    />
                    Active
                  </label>
                </div>

                <p className="text-xs text-slate-400">
                  Allowed placeholders: {template.allowedPlaceholders.map((token) => `{{${token}}}`).join(", ")}
                </p>

                <label className="block space-y-1">
                  <span className="text-xs text-slate-300">Subject</span>
                  <input
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    value={template.subject}
                    onChange={(event) => updateTemplateValue(template.id, "subject", event.target.value)}
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-slate-300">HTML body</span>
                  <textarea
                    className="h-32 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    value={template.htmlBody}
                    onChange={(event) => updateTemplateValue(template.id, "htmlBody", event.target.value)}
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-slate-300">Plain text body</span>
                  <textarea
                    className="h-28 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    value={template.textBody}
                    onChange={(event) => updateTemplateValue(template.id, "textBody", event.target.value)}
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={savingTemplateId === template.id}
                    onClick={() => saveTemplate(template.id)}
                  >
                    {savingTemplateId === template.id ? "Saving..." : "Save template"}
                  </button>
                  <button
                    type="button"
                    className="rounded border border-slate-400 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={previewingTemplateId === template.id}
                    onClick={() => previewTemplate(template.id)}
                  >
                    {previewingTemplateId === template.id ? "Rendering preview..." : "Preview"}
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
                    <div
                      className="rounded bg-white p-3 text-black"
                      dangerouslySetInnerHTML={{ __html: preview.rendered.htmlBody }}
                    />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {templatesStatus ? <p className="text-sm text-slate-200">{templatesStatus}</p> : null}
      </section>
    </section>
  );
}
