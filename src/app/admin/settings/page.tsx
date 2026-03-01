"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { isVideoAsset, shouldUseUnoptimizedImage } from "@/lib/media";
import {
  defaultSiteImages,
  getMaxSiteImageValueLength,
  MAX_HERO_VIDEO_FILE_BYTES,
  sanitizeSiteImages,
  siteImageUsage,
  type SiteImageKey,
  type SiteImages,
} from "@/lib/site-images";
import {
  defaultQualificationCertificates,
  isPdfCertificateAsset,
  type QualificationCertificateContent,
} from "@/lib/qualification-certificates";
import { defaultSiteContent, sanitizeSiteContent, type SiteContent } from "@/lib/site-content";
import VersionBadge from "@/components/admin/VersionBadge";

type AdminSettingsResponse = {
  qualificationCertificates: QualificationCertificateContent[];
  siteImages: SiteImages;
} & SiteContent;

const imageFields: Array<{ key: SiteImageKey; label: string }> = (
  Object.keys(defaultSiteImages) as SiteImageKey[]
)
  .map((key) => ({
    key,
    label: siteImageUsage[key].label,
  }));

const videoEnabledImageFields: Partial<Record<SiteImageKey, boolean>> = {
  hero: true,
  scene2Story: true,
  scene3Story: true,
  bookingCta: true,
};

const videoUploadAccept = "image/*,video/mp4,video/quicktime,video/x-m4v,video/*,.mp4,.mov,.m4v";

const imageFileNamePattern = /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i;
const videoFileNamePattern = /\.(mp4|mov|m4v|webm|ogv)$/i;
const mbFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

function SiteMediaPreview({ src, alt }: { src: string; alt: string }) {
  if (isVideoAsset(src)) {
    return <video src={src} className="h-full w-full object-contain" muted loop playsInline controls preload="metadata" />;
  }

  return <Image src={src} alt={alt} width={240} height={160} className="h-full w-full object-contain" unoptimized={shouldUseUnoptimizedImage(src)} />;
}

const idealImageDimensions: Record<SiteImageKey, string> = {
  hero: "2000 × 1200 px",
  scene2Story: "1800 × 1200 px",
  scene3Story: "1800 × 1200 px",
  chapterClassic: "1800 × 1200 px",
  chapterHybrid: "1800 × 1200 px",
  chapterVolume: "1800 × 1200 px",
  chapterRefill: "1800 × 1200 px",
  bookingCta: "1800 × 1200 px",
  policies: "1800 × 1200 px",
};

type HomepageCopyFieldConfig = {
  label: string;
  field: keyof SiteContent;
  control?: "text" | "textarea" | "checkbox";
};

const homepageCopyByImageField: Partial<Record<SiteImageKey, HomepageCopyFieldConfig[]>> = {
  hero: [
    { label: "Hero eyebrow", field: "heroEyebrow" },
    { label: "Hero title", field: "heroTitle" },
    { label: "Hero description", field: "heroSubtitle", control: "textarea" },
  ],
  scene2Story: [
    { label: "Show scene", field: "scene2Enabled", control: "checkbox" },
    { label: "Scene eyebrow", field: "scene2Eyebrow" },
    { label: "Scene title", field: "scene2Title" },
    { label: "Scene description", field: "scene2Description", control: "textarea" },
  ],
  scene3Story: [
    { label: "Show scene", field: "scene3Enabled", control: "checkbox" },
    { label: "Scene eyebrow", field: "scene3Eyebrow" },
    { label: "Scene title", field: "scene3Title" },
    { label: "Scene description", field: "scene3Description", control: "textarea" },
  ],
  chapterClassic: [
    { label: "Classic title", field: "chapter1Title" },
    { label: "Classic description", field: "chapter1Copy", control: "textarea" },
  ],
  chapterHybrid: [
    { label: "Hybrid title", field: "chapter2Title" },
    { label: "Hybrid description", field: "chapter2Copy", control: "textarea" },
  ],
  chapterVolume: [
    { label: "Volume title", field: "chapter3Title" },
    { label: "Volume description", field: "chapter3Copy", control: "textarea" },
  ],
  chapterRefill: [
    { label: "Refill title", field: "chapter4Title" },
    { label: "Refill description", field: "chapter4Copy", control: "textarea" },
  ],
  bookingCta: [
    { label: "Booking CTA title", field: "bookingCtaTitle" },
    { label: "Booking CTA button label", field: "bookingCtaButtonLabel" },
    { label: "Booking CTA description", field: "bookingCtaBody", control: "textarea" },
  ],
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function inferVideoMimeType(file: File) {
  if (file.type.startsWith("video/")) {
    return file.type;
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".mp4") || lowerName.endsWith(".m4v")) return "video/mp4";
  if (lowerName.endsWith(".mov")) return "video/quicktime";
  if (lowerName.endsWith(".webm")) return "video/webm";
  if (lowerName.endsWith(".ogv")) return "video/ogg";
  return null;
}

function normalizeVideoDataUrl(dataUrl: string, file: File) {
  if (!dataUrl.startsWith("data:")) {
    return dataUrl;
  }

  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    return dataUrl;
  }

  const header = dataUrl.slice(0, commaIndex);
  if (header.startsWith("data:video/")) {
    return dataUrl;
  }

  const inferredMimeType = inferVideoMimeType(file);
  if (!inferredMimeType) {
    return dataUrl;
  }

  const encodedBody = dataUrl.slice(commaIndex + 1);
  return `data:${inferredMimeType};base64,${encodedBody}`;
}

export default function AdminSettingsPage() {
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const [imageUploadStatus, setImageUploadStatus] = useState("");

  const [settingsStatus, setSettingsStatus] = useState("");
  const [qualificationCertificates, setQualificationCertificates] = useState<QualificationCertificateContent[]>(
    defaultQualificationCertificates,
  );
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent);

  const loadSettings = async () => {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    if (!response.ok) {
      setSettingsStatus("Could not load settings.");
      return;
    }

    const data = (await response.json()) as AdminSettingsResponse;
    setQualificationCertificates(data.qualificationCertificates ?? defaultQualificationCertificates);
    setImages(sanitizeSiteImages(data.siteImages));
    setSiteContent(sanitizeSiteContent(data));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const uploadImage = async (key: SiteImageKey, file: File | null) => {
    if (!file) {
      return;
    }

    const isVideoField = Boolean(videoEnabledImageFields[key]);
    const hasImageFileName = imageFileNamePattern.test(file.name);
    const hasVideoFileName = videoFileNamePattern.test(file.name);
    const isImageMimeType = file.type.startsWith("image/");
    const isVideoMimeType = file.type.startsWith("video/");
    const isImageFile = isImageMimeType || hasImageFileName;
    const isVideoFile = isVideoMimeType || hasVideoFileName;

    if (!isImageFile && !(isVideoField && isVideoFile)) {
      setImageUploadStatus(
        isVideoField
          ? "Please choose an image or video file for this section."
          : "This section only supports image files.",
      );
      return;
    }

    if (key === "hero" && isVideoFile && file.size > MAX_HERO_VIDEO_FILE_BYTES) {
      setImageUploadStatus(`Hero MP4 uploads must be ${mbFormatter.format(MAX_HERO_VIDEO_FILE_BYTES / (1024 * 1024))}MB or smaller.`);
      return;
    }

    try {
      const rawDataUrl = await fileToDataUrl(file);
      const dataUrl = isVideoFile ? normalizeVideoDataUrl(rawDataUrl, file) : rawDataUrl;

      if (dataUrl.length > getMaxSiteImageValueLength(key, dataUrl)) {
        setImageUploadStatus("This media file is too large to save. Please choose a smaller file.");
        return;
      }

      if (isVideoAsset(dataUrl) && !videoEnabledImageFields[key]) {
        setImageUploadStatus("This section only supports images. Please choose an image file.");
        return;
      }

      setImages((current) => ({ ...current, [key]: dataUrl }));
      setImageUploadStatus(
        `${imageFields.find((field) => field.key === key)?.label ?? "Media"} uploaded. Click Save website UI + business settings to apply.`,
      );
    } catch {
      setImageUploadStatus("Could not upload media. Please try a different file.");
    }
  };

  const selectMp4ForField = (key: SiteImageKey) => {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = "video/mp4,.mp4";
    picker.onchange = () => {
      void uploadImage(key, picker.files?.[0] ?? null);
      picker.value = "";
    };
    picker.click();
  };

  const updateCertificateField = (index: number, field: keyof QualificationCertificateContent, value: string) => {
    setQualificationCertificates((current) =>
      current.map((certificate, certificateIndex) =>
        certificateIndex === index ? { ...certificate, [field]: value } : certificate,
      ),
    );
  };

  const updateSiteContentField = <K extends keyof SiteContent>(field: K, value: SiteContent[K]) => {
    setSiteContent((current) => ({ ...current, [field]: value }));
  };

  const uploadCertificateImage = async (index: number, file: File | null) => {
    if (!file) {
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      updateCertificateField(index, "image", dataUrl);
      setImageUploadStatus(`Certificate ${index + 1} file uploaded. Click Save website UI + business settings to apply.`);
    } catch {
      setImageUploadStatus("Could not upload certificate file. Please try a different file.");
    }
  };

  const saveBusinessSettings = async () => {
    setSettingsStatus("");
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qualificationCertificates: qualificationCertificates.map((certificate) => ({
          title: certificate.title.trim(),
          description: certificate.description.trim(),
          ...(certificate.image?.trim() ? { image: certificate.image.trim() } : {}),
        })),
        siteImages: images,
        ...siteContent,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errorDetail = data.detail ? ` ${data.detail}` : "";
      setSettingsStatus(data.error ? `${data.error}.${errorDetail}`.trim() : "Could not save website UI + business settings.");
      return;
    }

    const data = (await response.json()) as AdminSettingsResponse;
    setQualificationCertificates(data.qualificationCertificates ?? defaultQualificationCertificates);
    setImages(sanitizeSiteImages(data.siteImages));
    setSiteContent(sanitizeSiteContent(data));
    setSettingsStatus("Website UI + business settings saved. Story media + content saved together.");
  };

  return (
    <section className="max-w-4xl space-y-10 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Website UI</h1>
        <VersionBadge />
      </div>

      <section className="space-y-4 rounded border border-slate-800 bg-slate-950 p-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Landing media</h2>
          <p className="text-sm text-slate-300">Upload all homepage and landing media assets, including story scene visuals, in this section.</p>
          <p className="text-xs text-slate-400">All uploads here are saved together with homepage copy using the Save website UI + business settings button below.</p>
          <p className="text-xs text-slate-400">For iOS video uploads, use the Files picker and MP4/MOV files when available.</p>
        </div>

        {imageFields.map((field) => (
          <label key={field.key} className="block space-y-2 rounded border border-slate-800 bg-slate-900/30 p-3">
            <span className="text-sm font-medium text-slate-100">{field.label}</span>
            <p className="text-xs text-slate-300">Ideal size: {idealImageDimensions[field.key]}</p>
            <p className="text-xs text-slate-400">Used on: {siteImageUsage[field.key].usedOn.join(", ")}</p>
            <div className="flex h-24 w-36 items-center justify-center overflow-hidden rounded border border-slate-700 bg-slate-900 p-1">
              <SiteMediaPreview src={images[field.key]} alt={`${field.label} preview`} />
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
              <input
                type="file"
                accept={videoEnabledImageFields[field.key] ? videoUploadAccept : "image/*"}
                className="w-full min-w-0 rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 file:mr-3 file:rounded file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-black hover:file:bg-slate-200"
                onChange={(event) => {
                  uploadImage(field.key, event.target.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
              />
              {videoEnabledImageFields[field.key] ? (
                <button
                  type="button"
                  className="shrink-0 rounded border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700"
                  onClick={() => selectMp4ForField(field.key)}
                >
                  Select MP4
                </button>
              ) : null}
              <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-700 bg-slate-900 p-1">
                <SiteMediaPreview src={images[field.key]} alt={`${field.label} small preview`} />
              </div>
            </div>

            {homepageCopyByImageField[field.key]?.length ? (
              <div className="space-y-2 rounded border border-slate-700/70 bg-slate-950/40 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-300">Homepage copy for this image</p>
                {homepageCopyByImageField[field.key]?.map((copyField) => {
                  const controlType = copyField.control ?? "text";

                  if (controlType === "checkbox") {
                    return (
                      <label key={copyField.field} className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(siteContent[copyField.field])}
                          onChange={(event) => updateSiteContentField(copyField.field, event.target.checked)}
                        />
                        {copyField.label}
                      </label>
                    );
                  }

                  if (controlType === "textarea") {
                    return (
                      <label key={copyField.field} className="space-y-1 text-sm text-slate-100">
                        <span>{copyField.label}</span>
                        <textarea
                          className="min-h-20 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                          maxLength={320}
                          value={String(siteContent[copyField.field])}
                          onChange={(event) => updateSiteContentField(copyField.field, event.target.value)}
                        />
                      </label>
                    );
                  }

                  return (
                    <label key={copyField.field} className="space-y-1 text-sm text-slate-100">
                      <span>{copyField.label}</span>
                      <input
                        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                        maxLength={320}
                        value={String(siteContent[copyField.field])}
                        onChange={(event) => updateSiteContentField(copyField.field, event.target.value)}
                      />
                    </label>
                  );
                })}
              </div>
            ) : null}
          </label>
        ))}

        {imageUploadStatus ? <p className="text-sm text-slate-200">{imageUploadStatus}</p> : null}
      </section>

      <section className="space-y-4 rounded border border-slate-800 bg-slate-950 p-4">
        <h2 className="text-lg font-semibold">Homepage content</h2>
        <p className="text-sm text-slate-300">Manage homepage copy, media, and qualification content in one place.</p>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-100">Homepage qualification certificates</p>
          <p className="text-xs text-slate-400">Edit the titles and descriptions shown in the qualifications section.</p>

          {qualificationCertificates.map((certificate, index) => (
            <div key={index} className="space-y-2 rounded border border-slate-800 bg-slate-900/30 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-300">Certificate {index + 1}</p>
              <input
                type="text"
                maxLength={120}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                value={certificate.title}
                onChange={(event) => updateCertificateField(index, "title", event.target.value)}
                placeholder="Certificate title"
              />
              <textarea
                maxLength={320}
                className="min-h-24 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                value={certificate.description}
                onChange={(event) => updateCertificateField(index, "description", event.target.value)}
                placeholder="Certificate description"
              />
              <div className="space-y-2">
                <p className="text-xs text-slate-300">Certificate file (image or PDF)</p>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 file:mr-3 file:rounded file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-black hover:file:bg-slate-200"
                    onChange={(event) => uploadCertificateImage(index, event.target.files?.[0] ?? null)}
                  />
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-700 bg-slate-900 p-1">
                    {isPdfCertificateAsset(certificate.image) ? (
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-200">PDF</span>
                    ) : (
                      <Image
                        src={certificate.image?.trim() || images.chapterHybrid}
                        alt={`Certificate ${index + 1} preview`}
                        width={120}
                        height={84}
                        className="h-full w-full object-contain"
                        unoptimized={shouldUseUnoptimizedImage(certificate.image?.trim() || images.chapterHybrid)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 rounded border border-slate-800 bg-slate-900/30 p-4">
          <p className="text-sm font-medium text-slate-100">Homepage copy</p>
          <p className="text-xs text-slate-400">Each homepage copy item is now grouped under its matching image in the Landing media section above.</p>
        </div>

        <button
          type="button"
          className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200"
          onClick={saveBusinessSettings}
        >
          Save website UI + business settings
        </button>
        {settingsStatus ? <p className="text-sm text-slate-200">{settingsStatus}</p> : null}
      </section>

    </section>
  );
}
