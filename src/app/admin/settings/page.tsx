"use client";

import { FormEvent, useEffect, useState } from "react";
import { defaultSiteImages, SITE_IMAGES_STORAGE_KEY, type SiteImageKey, type SiteImages } from "@/lib/site-images";

const imageFields: Array<{ key: SiteImageKey; label: string }> = [
  { key: "hero", label: "Hero image" },
  { key: "precision", label: "Precision story image" },
  { key: "closeup", label: "Close-up story image" },
  { key: "luxury", label: "Luxury story image" },
  { key: "booking", label: "Booking panel image" },
  { key: "policies", label: "Policies panel image" },
];

export default function AdminSettingsPage() {
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const [savedMessage, setSavedMessage] = useState("");

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

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.localStorage.setItem(SITE_IMAGES_STORAGE_KEY, JSON.stringify(images));
    setSavedMessage("Saved. Refresh the front page to see updates.");
  };

  return (
    <section className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Owner settings</h1>
        <p className="mt-2 text-sm text-slate-600">Update the main homepage image URLs used for hero, stories, booking, and policy panels.</p>
      </div>

      <form className="space-y-4" onSubmit={save}>
        {imageFields.map((field) => (
          <label key={field.key} className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">{field.label}</span>
            <input
              type="url"
              className="w-full rounded border p-2 text-sm"
              value={images[field.key]}
              onChange={(event) => setImages((current) => ({ ...current, [field.key]: event.target.value }))}
            />
          </label>
        ))}

        <button type="submit" className="rounded bg-black px-4 py-2 text-sm font-medium text-white">
          Save image settings
        </button>
        {savedMessage ? <p className="text-sm text-green-700">{savedMessage}</p> : null}
      </form>
    </section>
  );
}
