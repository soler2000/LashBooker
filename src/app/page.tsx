"use client";

import { useEffect, useState } from "react";
import Hero from "@/components/landing/Hero";
import Header from "@/components/landing/Header";
import HorizontalChapter from "@/components/landing/HorizontalChapter";
import Scene from "@/components/landing/Scene";
import StickyStoryScene from "@/components/landing/StickyStoryScene";
import { defaultSiteImages, SITE_IMAGES_STORAGE_KEY, type SiteImages } from "@/lib/site-images";

export default function Home() {
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);

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

  return (
    <main className="bg-black text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="pointer-events-auto border-b border-white/10 bg-black/35 backdrop-blur-sm">
          <Header />
        </div>
      </div>

      <Hero image={images.hero} />

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
      </Scene>

      <Scene
        sectionClassName="flex h-screen w-full items-center justify-center bg-zinc-950 px-6 md:px-12"
        contentClassName="max-w-3xl text-center"
      >
        <p className="text-xs uppercase tracking-[0.35em] text-white/65">Before you visit</p>
        <h2 className="mt-4 text-4xl font-semibold md:text-6xl">Studio policies</h2>
        <p className="mt-5 text-white/80 md:text-lg">
          Deposits, cancellation windows, and preparation guidance are all in one place.
        </p>
      </Scene>
    </main>
  );
}
