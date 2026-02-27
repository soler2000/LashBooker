"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Hero from "@/components/landing/Hero";
import HorizontalChapter from "@/components/landing/HorizontalChapter";
import Scene from "@/components/landing/Scene";
import StickyStoryScene from "@/components/landing/StickyStoryScene";
import { defaultSiteImages, SITE_IMAGES_STORAGE_KEY, type SiteImages } from "@/lib/site-images";

type PublicSettingsResponse = {
  instagramUrl: string | null;
};

export default function Home() {
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const [instagramUrl, setInstagramUrl] = useState<string | null>(null);

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

  useEffect(() => {
    const loadPublicSettings = async () => {
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) {
        setInstagramUrl(null);
        return;
      }

      const data = (await response.json()) as PublicSettingsResponse;
      setInstagramUrl(data.instagramUrl ?? null);
    };

    loadPublicSettings();
  }, []);

  return (
    <main className="bg-black text-white">
      <Hero image={images.hero} instagramUrl={instagramUrl} />

      <StickyStoryScene
        eyebrow="Scene 2"
        title="Designed around your features."
        description="Every appointment starts with personalized mapping so curl, density, and length complement your eyes—not overwhelm them."
        image={images.precision}
      />

      <StickyStoryScene
        eyebrow="Scene 3"
        title="Studio calm, editorial results."
        description="From consultation to final mirror reveal, each step is paced for comfort while delivering camera-ready detail."
        image={images.luxury}
      />

      <HorizontalChapter images={images} />

      <Scene
        image={images.booking}
        overlay="linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,.82))"
        sectionClassName="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 md:px-12"
        contentClassName="relative z-10 text-center"
      >
        <h2 className="text-4xl font-semibold md:text-7xl">Ready for your next set?</h2>
        <p className="mx-auto mt-5 max-w-2xl text-white/80 md:text-lg">
          Reserve your appointment in minutes and we&apos;ll guide you to the perfect service choice.
        </p>
        <Link href="/book" className="mt-8 inline-flex rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition hover:bg-white/85">
          Start booking
        </Link>
      </Scene>
    </main>
  );
}
