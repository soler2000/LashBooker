"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { defaultSiteImages, SITE_IMAGES_STORAGE_KEY, type SiteImages } from "@/lib/site-images";

const heroShots = [
  {
    title: "Precision artistry",
    description:
      "Every set is tailored to your eye shape, creating a refined look that feels naturally effortless.",
    imageKey: "precision",
  },
  {
    title: "Close-up perfection",
    description:
      "Ultra-fine lash mapping and pro-grade products deliver detail you can see in every blink.",
    imageKey: "closeup",
  },
  {
    title: "Luxury in motion",
    description:
      "A calm, modern studio flow inspired by premium product launches and beautifully paced storytelling.",
    imageKey: "luxury",
  },
] as const;

export default function Home() {
  const [images, setImages] = useState<SiteImages>(defaultSiteImages);
  const sliderRef = useRef<HTMLDivElement>(null);

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
    const slider = sliderRef.current;

    if (!slider) {
      return;
    }

    const setCenter = () => {
      slider.scrollTo({ left: slider.clientWidth, behavior: "auto" });
    };

    setCenter();
    window.addEventListener("resize", setCenter);

    return () => window.removeEventListener("resize", setCenter);
  }, []);

  const scrollPanels = (direction: "left" | "right") => {
    const slider = sliderRef.current;

    if (!slider) {
      return;
    }

    const movement = direction === "right" ? slider.clientWidth : -slider.clientWidth;
    slider.scrollBy({ left: movement, behavior: "smooth" });
  };

  const storyPanels = useMemo(
    () => [
      {
        heading: "Studio policies",
        body: "Deposits secure your slot, and all changes must be made at least 24 hours before your appointment.",
        image: images.policies,
      },
      {
        heading: "Welcome",
        body: "Explore the lash stories below and use the actions to move between booking and policy details.",
        image: images.hero,
      },
      {
        heading: "Book your set",
        body: "Classic, hybrid, and volume options are available with flexible appointment times.",
        image: images.booking,
      },
    ],
    [images],
  );

  return (
    <main className="bg-black text-white">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-black/70 px-6 py-4 backdrop-blur md:px-12">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">LashBooker Studio</p>
          <Link href="/login" className="text-sm font-medium text-white/85 transition hover:text-white">
            Login
          </Link>
        </div>
      </div>

      <section className="relative flex min-h-screen items-end overflow-hidden px-6 pb-16 pt-24 md:px-12">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.25) 45%, rgba(0,0,0,.55)), url('${images.hero}')`,
          }}
          aria-hidden
        />
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-7xl">
            Elevate every look with cinematic lash detail.
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/80 md:text-lg">
            Scroll through an immersive showcase and use the quick actions to move left for policies or right for booking.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => scrollPanels("right")}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/85"
            >
              Book now
            </button>
            <button
              type="button"
              onClick={() => scrollPanels("left")}
              className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              View policies
            </button>
          </div>
        </div>
      </section>

      <section className="px-0 pb-10">
        <div ref={sliderRef} className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {storyPanels.map((panel) => (
            <article key={panel.heading} className="relative min-h-[70vh] w-full shrink-0 snap-start overflow-hidden px-6 py-20 md:px-12">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(0,0,0,.78), rgba(0,0,0,.25) 45%, rgba(0,0,0,.66)), url('${panel.image}')`,
                }}
                aria-hidden
              />
              <div className="relative z-10 mx-auto w-full max-w-5xl">
                <h2 className="max-w-3xl text-3xl font-semibold md:text-5xl">{panel.heading}</h2>
                <p className="mt-5 max-w-2xl text-base text-white/80 md:text-lg">{panel.body}</p>
                {panel.heading === "Book your set" ? (
                  <Link href="/book" className="mt-7 inline-flex rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">
                    Open booking options
                  </Link>
                ) : null}
                {panel.heading === "Studio policies" ? (
                  <Link href="/policies" className="mt-7 inline-flex rounded-full border border-white/50 px-5 py-2 text-sm font-semibold text-white">
                    Read full policies
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        {heroShots.map((shot) => (
          <article key={shot.title} className="relative min-h-[145vh] overflow-hidden">
            <div
              className="sticky top-0 h-screen bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(to top, rgba(0,0,0,.88), rgba(0,0,0,.2) 45%, rgba(0,0,0,.68)), url('${images[shot.imageKey]}')`,
              }}
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-0 flex items-end px-6 pb-16 md:px-12">
              <div className="mx-auto w-full max-w-5xl">
                <div className="sticky bottom-8">
                  <h2 className="max-w-2xl text-3xl font-semibold md:text-6xl">{shot.title}</h2>
                  <p className="mt-5 max-w-xl text-base text-white/80 md:text-lg">{shot.description}</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
