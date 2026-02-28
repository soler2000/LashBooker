"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { isVideoAsset } from "@/lib/media";
import {
  defaultSiteImages,
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

type AdminSettingsResponse = {
  depositRequired: boolean;
  instagramUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressPostcode: string | null;
  addressCountry: string | null;
  qualificationCertificates: QualificationCertificateContent[];
  siteImages: SiteImages;
};

const imageFields: Array<{ key: SiteImageKey; label: string }> = (
  Object.keys(defaultSiteImages) as SiteImageKey[]
).map((key) => ({
  key,
  label: siteImageUsage[key].label,
}));


const videoEnabledImageFields: Partial<Record<SiteImageKey, boolean>> = {
  hero: true,
  scene2Story: true,
  scene3Story: true,
  bookingCta: true,
};

const imageUploadAccept = "image/*,.avif,.bmp,.gif,.jpg,.jpeg,.png,.svg,.webp";
const videoUploadAccept = "video/mp4,video/quicktime,video/x-m4v,video/*,.mp4,.mov,.m4v,.webm,.ogv";
const MAX_MEDIA_UPLOAD_BYTES = 20 * 1024 * 1024;

const imageFileNamePattern = /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i;
const videoFileNamePattern = /\.(mp4|mov|m4v|webm|ogv)$/i;

function SiteMediaPreview({ src, alt }: { src: string; alt: string }) {
  if (isVideoAsset(src)) {
    return <video src={src} className="h-full w-full object-contain" muted loop playsInline controls preload="metadata" />;
  }

  return <Image src={src} alt={alt} width={240} height={160} className="h-full w-full object-contain" />;
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

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export default function AdminSettingsPage() {
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const [savedMessage, setSavedMessage] = useState("");
  const [imageUploadStatus, setImageUploadStatus] = useState("");

  const [depositRequired, setDepositRequired] = useState(true);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressPostcode, setAddressPostcode] = useState("");
  const [addressCountry, setAddressCountry] = useState("");
  const [depositStatus, setDepositStatus] = useState("");
  const [qualificationCertificates, setQualificationCertificates] = useState<QualificationCertificateContent[]>(
    defaultQualificationCertificates,
  );

  const normalizeInstagramInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const loadSettings = async () => {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    if (!response.ok) {
      setDepositStatus("Could not load settings.");
      return;
    }

    const data = (await response.json()) as AdminSettingsResponse;
    setDepositRequired(data.depositRequired);
    setInstagramUrl(data.instagramUrl ?? "");
    setContactPhone(data.contactPhone ?? "");
    setContactEmail(data.contactEmail ?? "");
    setAddressLine1(data.addressLine1 ?? "");
    setAddressLine2(data.addressLine2 ?? "");
    setAddressCity(data.addressCity ?? "");
    setAddressPostcode(data.addressPostcode ?? "");
    setAddressCountry(data.addressCountry ?? "");
    setQualificationCertificates(data.qualificationCertificates ?? defaultQualificationCertificates);
    setImages(sanitizeSiteImages(data.siteImages));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavedMessage("");

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteImages: images }),
    });

    if (!response.ok) {
      setSavedMessage("Could not save image settings.");
      return;
    }

    const data = (await response.json()) as AdminSettingsResponse;
    setImages(sanitizeSiteImages(data.siteImages));
    setSavedMessage("Image settings saved and now sync across devices.");
  };

  const uploadImage = async (key: SiteImageKey, file: File | null) => {
    if (!file) {
      return;
    }

    const isVideoField = Boolean(videoEnabledImageFields[key]);

    if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
      setImageUploadStatus("Please choose a media file up to 20MB.");
      return;
    }
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

    try {
      const dataUrl = await fileToDataUrl(file);

      if (isVideoAsset(dataUrl) && !videoEnabledImageFields[key]) {
        setImageUploadStatus("This section only supports images. Please choose an image file.");
        return;
      }

      setImages((current) => ({ ...current, [key]: dataUrl }));
      setImageUploadStatus(
        `${imageFields.find((field) => field.key === key)?.label ?? "Media"} uploaded. Click save to apply.`,
      );
    } catch {
      setImageUploadStatus("Could not upload media. Please try a different file.");
    }
  };

  const updateCertificateField = (index: number, field: keyof QualificationCertificateContent, value: string) => {
    setQualificationCertificates((current) =>
      current.map((certificate, certificateIndex) =>
        certificateIndex === index ? { ...certificate, [field]: value } : certificate,
      ),
    );
  };

  const uploadCertificateImage = async (index: number, file: File | null) => {
    if (!file) {
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      updateCertificateField(index, "image", dataUrl);
      setImageUploadStatus(`Certificate ${index + 1} file uploaded. Click save to apply.`);
    } catch {
      setImageUploadStatus("Could not upload certificate file. Please try a different file.");
    }
  };

  const saveBusinessSettings = async () => {
    setDepositStatus("");
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        depositRequired,
        instagramUrl: normalizeInstagramInput(instagramUrl) || null,
        contactPhone: contactPhone.trim() || null,
        contactEmail: contactEmail.trim() || null,
        addressLine1: addressLine1.trim() || null,
        addressLine2: addressLine2.trim() || null,
        addressCity: addressCity.trim() || null,
        addressPostcode: addressPostcode.trim() || null,
        addressCountry: addressCountry.trim() || null,
        qualificationCertificates: qualificationCertificates.map((certificate) => ({
          title: certificate.title.trim(),
          description: certificate.description.trim(),
          ...(certificate.image?.trim() ? { image: certificate.image.trim() } : {}),
        })),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errorDetail = data.detail ? ` ${data.detail}` : "";
      setDepositStatus(data.error ? `${data.error}.${errorDetail}`.trim() : "Could not save settings.");
      return;
    }

    const data = (await response.json()) as AdminSettingsResponse;
    setInstagramUrl(data.instagramUrl ?? "");
    setContactPhone(data.contactPhone ?? "");
    setContactEmail(data.contactEmail ?? "");
    setAddressLine1(data.addressLine1 ?? "");
    setAddressLine2(data.addressLine2 ?? "");
    setAddressCity(data.addressCity ?? "");
    setAddressPostcode(data.addressPostcode ?? "");
    setAddressCountry(data.addressCountry ?? "");
    setQualificationCertificates(data.qualificationCertificates ?? defaultQualificationCertificates);
    setImages(sanitizeSiteImages(data.siteImages));
    setDepositStatus(
      depositRequired
        ? "Settings saved. Deposits are required for new bookings."
        : "Settings saved. Deposits are disabled; bookings confirm immediately.",
    );
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
          <p className="text-xs text-slate-400">For iOS uploads, if the combined picker hides videos, use the dedicated video picker below.</p>
        </div>

        {imageFields.map((field) => (
          <label key={field.key} className="block space-y-2 rounded border border-slate-800 bg-slate-900/30 p-3">
            <span className="text-sm font-medium text-slate-100">{field.label}</span>
            <p className="text-xs text-slate-300">Ideal size: {idealImageDimensions[field.key]}</p>
            <p className="text-xs text-slate-400">Used on: {siteImageUsage[field.key].usedOn.join(", ")}</p>
            <div className="flex h-24 w-36 items-center justify-center overflow-hidden rounded border border-slate-700 bg-slate-900 p-1">
              <SiteMediaPreview src={images[field.key]} alt={`${field.label} preview`} />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-full space-y-2">
                <input
                  type="file"
                  accept={imageUploadAccept}
                  className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 file:mr-3 file:rounded file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-black hover:file:bg-slate-200"
                  onChange={(event) => {
                    uploadImage(field.key, event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                />
                {videoEnabledImageFields[field.key] ? (
                  <input
                    type="file"
                    accept={videoUploadAccept}
                    className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 file:mr-3 file:rounded file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-black hover:file:bg-slate-200"
                    onChange={(event) => {
                      uploadImage(field.key, event.target.files?.[0] ?? null);
                      event.currentTarget.value = "";
                    }}
                  />
                ) : null}
              </div>
              <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-700 bg-slate-900 p-1">
                <SiteMediaPreview src={images[field.key]} alt={`${field.label} small preview`} />
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
        <div className="space-y-1">
          <label htmlFor="instagram-url" className="text-sm font-medium text-slate-100">Instagram profile URL</label>
          <input
            id="instagram-url"
            type="url"
            placeholder="https://instagram.com/yourhandle"
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            value={instagramUrl}
            onChange={(event) => setInstagramUrl(event.target.value)}
          />
          <p className="text-xs text-slate-400">Used on the public homepage header. Leave blank to hide the link.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="contact-phone" className="text-sm font-medium text-slate-100">Business phone number</label>
          <input
            id="contact-phone"
            type="text"
            maxLength={40}
            placeholder="+44 7700 900123"
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
          />
          <p className="text-xs text-slate-400">Displayed on the homepage contact section. Leave blank to hide it.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="contact-email" className="text-sm font-medium text-slate-100">Business email address</label>
          <input
            id="contact-email"
            type="email"
            maxLength={320}
            placeholder="hello@example.com"
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
          />
          <p className="text-xs text-slate-400">Used for the public contact section. Leave blank to hide it.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="address-line-1" className="text-sm font-medium text-slate-100">Address line 1</label>
          <input
            id="address-line-1"
            type="text"
            maxLength={120}
            placeholder="123 Example Street"
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            value={addressLine1}
            onChange={(event) => setAddressLine1(event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="address-line-2" className="text-sm font-medium text-slate-100">Address line 2</label>
          <input
            id="address-line-2"
            type="text"
            maxLength={120}
            placeholder="Suite, unit, or building"
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            value={addressLine2}
            onChange={(event) => setAddressLine2(event.target.value)}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="address-city" className="text-sm font-medium text-slate-100">Town/City</label>
            <input
              id="address-city"
              type="text"
              maxLength={80}
              placeholder="London"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={addressCity}
              onChange={(event) => setAddressCity(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="address-postcode" className="text-sm font-medium text-slate-100">Postcode</label>
            <input
              id="address-postcode"
              type="text"
              maxLength={24}
              placeholder="SW1A 1AA"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={addressPostcode}
              onChange={(event) => setAddressPostcode(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="address-country" className="text-sm font-medium text-slate-100">Country</label>
            <input
              id="address-country"
              type="text"
              maxLength={80}
              placeholder="United Kingdom"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={addressCountry}
              onChange={(event) => setAddressCountry(event.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-slate-400">Address fields are shown on the homepage. Leave any field blank to hide it.</p>

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
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200"
          onClick={saveBusinessSettings}
        >
          Save business settings
        </button>
        {depositStatus ? <p className="text-sm text-slate-200">{depositStatus}</p> : null}
      </section>

    </section>
  );
}
