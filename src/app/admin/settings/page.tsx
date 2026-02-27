"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import {
  defaultQualifications,
  QUALIFICATIONS_STORAGE_KEY,
  type QualificationItem,
} from "@/lib/qualifications";
import {
  defaultSiteImages,
  SITE_IMAGES_STORAGE_KEY,
  siteImageUsage,
  type SiteImageKey,
  type SiteImages,
} from "@/lib/site-images";

type AdminSettingsResponse = {
  depositRequired: boolean;
  instagramUrl: string | null;
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

const createQualification = (): QualificationItem => ({
  id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
  title: "",
  description: "",
  image: defaultQualifications[0]?.image ?? defaultSiteImages.precision,
});

export default function AdminSettingsPage() {
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const [qualifications, setQualifications] = useState<QualificationItem[]>(defaultQualifications);
  const [savedMessage, setSavedMessage] = useState("");
  const [imageUploadStatus, setImageUploadStatus] = useState("");

  const [depositRequired, setDepositRequired] = useState(true);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [depositStatus, setDepositStatus] = useState("");

  useEffect(() => {
    const storedImages = window.localStorage.getItem(SITE_IMAGES_STORAGE_KEY);

    if (storedImages) {
      try {
        const parsed = JSON.parse(storedImages) as Partial<SiteImages>;
        setImages({ ...defaultSiteImages, ...parsed });
      } catch {
        setImages(defaultSiteImages);
      }
    }

    const storedQualifications = window.localStorage.getItem(QUALIFICATIONS_STORAGE_KEY);

    if (!storedQualifications) {
      return;
    }

    try {
      const parsed = JSON.parse(storedQualifications) as QualificationItem[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setQualifications(parsed);
        return;
      }
      setQualifications(defaultQualifications);
    } catch {
      setQualifications(defaultQualifications);
    }
  }, []);

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
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.localStorage.setItem(SITE_IMAGES_STORAGE_KEY, JSON.stringify(images));
    window.localStorage.setItem(QUALIFICATIONS_STORAGE_KEY, JSON.stringify(qualifications));
    setSavedMessage("Saved. Refresh the front page to see updated images and qualifications.");
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

  const uploadQualificationImage = async (id: string, file: File | null) => {
    if (!file) {
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setQualifications((current) =>
        current.map((qualification) =>
          qualification.id === id ? { ...qualification, image: dataUrl } : qualification,
        ),
      );
      setImageUploadStatus("Qualification image uploaded. Click save to apply.");
    } catch {
      setImageUploadStatus("Could not upload qualification image. Please try a different file.");
    }
  };

  const updateQualification = (id: string, field: "title" | "description", value: string) => {
    setQualifications((current) =>
      current.map((qualification) =>
        qualification.id === id ? { ...qualification, [field]: value } : qualification,
      ),
    );
  };

  const addQualification = () => {
    setQualifications((current) => [...current, createQualification()]);
  };

  const removeQualification = (id: string) => {
    setQualifications((current) => current.filter((qualification) => qualification.id !== id));
  };

  const saveDepositSettings = async () => {
    setDepositStatus("");
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        depositRequired,
        instagramUrl: normalizeInstagramInput(instagramUrl) || null,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setDepositStatus(data.error ?? "Could not save settings. Please enter a valid Instagram URL.");
      return;
    }

    const data = (await response.json()) as AdminSettingsResponse;
    setInstagramUrl(data.instagramUrl ?? "");
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

      <form onSubmit={save} className="space-y-8 rounded border border-slate-800 bg-slate-950 p-4">
        <div className="space-y-4">
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
        </div>

        <div className="space-y-4 rounded border border-slate-800 bg-slate-900/30 p-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Qualification certificates</h2>
            <p className="text-sm text-slate-300">
              Add, edit, and reorder qualification cards shown on the homepage.
            </p>
          </div>

          <div className="space-y-4">
            {qualifications.length === 0 ? (
              <p className="text-sm text-slate-300">No certificates configured yet. Add one to display this section on the homepage.</p>
            ) : null}

            {qualifications.map((qualification, index) => (
              <div key={qualification.id} className="space-y-3 rounded border border-slate-700 bg-slate-950/70 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-100">Certificate {index + 1}</p>
                  <button
                    type="button"
                    className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                    onClick={() => removeQualification(qualification.id)}
                  >
                    Remove
                  </button>
                </div>

                <label className="block space-y-1">
                  <span className="text-xs text-slate-300">Title</span>
                  <input
                    type="text"
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    value={qualification.title}
                    onChange={(event) => updateQualification(qualification.id, "title", event.target.value)}
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-slate-300">Description</span>
                  <textarea
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    rows={3}
                    value={qualification.description}
                    onChange={(event) => updateQualification(qualification.id, "description", event.target.value)}
                  />
                </label>

                <div className="space-y-2">
                  <span className="text-xs text-slate-300">Certificate image</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 file:mr-3 file:rounded file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-black hover:file:bg-slate-200"
                      onChange={(event) => uploadQualificationImage(qualification.id, event.target.files?.[0] ?? null)}
                    />
                    <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-700 bg-slate-900 p-1">
                      <Image
                        src={qualification.image}
                        alt={`${qualification.title || `Certificate ${index + 1}`} preview`}
                        width={120}
                        height={84}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
            onClick={addQualification}
          >
            Add qualification
          </button>
        </div>

        <button
          type="submit"
          className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200"
        >
          Save image and qualification settings
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

        <button
          type="button"
          className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-200"
          onClick={saveDepositSettings}
        >
          Save deposit settings
        </button>
        {depositStatus ? <p className="text-sm text-slate-200">{depositStatus}</p> : null}
      </section>

    </section>
  );
}
