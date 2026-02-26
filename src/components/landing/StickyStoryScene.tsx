"use client";

import { useRef } from "react";
import { clamp, usePrefersReducedMotion, useSectionProgress } from "@/components/landing/Scene";

type StickyStorySceneProps = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
};

export default function StickyStoryScene({ eyebrow, title, description, image }: StickyStorySceneProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const progress = useSectionProgress(sectionRef);
  const prefersReducedMotion = usePrefersReducedMotion();

  const bgScale = prefersReducedMotion ? 1 : 1 + progress * 0.08;
  const fadeIn = clamp((progress - 0.15) / 0.2);
  const fadeOut = clamp((0.85 - progress) / 0.2);
  const copyOpacity = prefersReducedMotion ? 1 : fadeIn * fadeOut;
  const copyTranslateY = prefersReducedMotion ? 0 : (0.5 - progress) * 50;

  return (
    <section ref={sectionRef} className="relative h-[180vh] bg-black">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,.35), rgba(0,0,0,.82)), url('${image}')`,
            transform: `scale(${bgScale})`,
          }}
          aria-hidden
        />
        <div
          className="relative z-10 mx-auto flex h-full w-full max-w-6xl items-center px-6 md:px-12"
          style={{ opacity: copyOpacity, transform: `translateY(${copyTranslateY}px)` }}
        >
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">{eyebrow}</p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight md:text-7xl">{title}</h2>
            <p className="mt-6 text-base text-white/80 md:text-xl">{description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
