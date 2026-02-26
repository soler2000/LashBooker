"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { usePrefersReducedMotion, useSectionProgress } from "@/components/landing/Scene";
import { defaultSiteImages, type SiteImages } from "@/lib/site-images";

type HorizontalChapterProps = {
  images: SiteImages;
};

export default function HorizontalChapter({ images }: HorizontalChapterProps) {
  const chapterRef = useRef<HTMLElement | null>(null);
  const progress = useSectionProgress(chapterRef);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [imageLoadFailed, setImageLoadFailed] = useState<Record<string, boolean>>({});

  const panels = [
    { title: "Classic sets", copy: "Soft definition for an elegant everyday finish.", image: images.precision, fallback: defaultSiteImages.precision },
    { title: "Hybrid blends", copy: "The balance between texture and featherlight volume.", image: images.closeup, fallback: defaultSiteImages.closeup },
    { title: "Volume artistry", copy: "Full-bodied drama designed to still feel weightless.", image: images.luxury, fallback: defaultSiteImages.luxury },
    { title: "Refill rhythm", copy: "A maintenance cadence that keeps your look immaculate.", image: images.booking, fallback: defaultSiteImages.booking },
  ];

  const panelCount = panels.length;
  const stickyStart = 1 / (panelCount + 1);
  const stickyEnd = panelCount / (panelCount + 1);
  const chapterProgress = (progress - stickyStart) / (stickyEnd - stickyStart);
  const normalizedProgress = Math.min(1, Math.max(0, chapterProgress));
  const xPercent = prefersReducedMotion ? 0 : normalizedProgress * (panelCount - 1) * -100;

  return (
    <section ref={chapterRef} className="relative h-[400vh] bg-black">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          className="flex h-full"
          style={{
            width: `${panels.length * 100}vw`,
            transform: `translate3d(${xPercent}vw, 0, 0)`,
            willChange: prefersReducedMotion ? "auto" : "transform",
          }}
        >
          {panels.map((panel, index) => (
            <article key={panel.title} className="relative h-screen w-screen shrink-0">
              <div className="absolute inset-0" aria-hidden>
                <Image
                  src={imageLoadFailed[panel.title] ? panel.fallback : panel.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={index < 2}
                  onError={() => setImageLoadFailed((current) => ({ ...current, [panel.title]: true }))}
                />
              </div>
              <div
                className="absolute inset-0"
                style={{ backgroundImage: "linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.2))" }}
                aria-hidden
              />
              <div className="relative z-10 flex h-full items-end px-6 pb-14 md:px-12 md:pb-20">
                <div className="max-w-xl">
                  <h3 className="text-4xl font-semibold md:text-6xl">{panel.title}</h3>
                  <p className="mt-4 text-white/80 md:text-lg">{panel.copy}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
