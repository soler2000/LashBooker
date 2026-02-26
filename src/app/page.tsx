"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { defaultSiteImages, SITE_IMAGES_STORAGE_KEY, type SiteImages } from "@/lib/site-images";

type StickyStorySceneProps = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

function useSectionProgress(ref: RefObject<HTMLElement>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const updateProgress = () => {
      frame = 0;
      const element = ref.current;

      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const value = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      setProgress(clamp(value));
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateProgress);
    };
  }, [ref]);

  return progress;
}

function StickyStoryScene({ eyebrow, title, description, image }: StickyStorySceneProps) {
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

function HorizontalChapter({ images }: { images: SiteImages }) {
  const chapterRef = useRef<HTMLElement | null>(null);
  const progress = useSectionProgress(chapterRef);
  const prefersReducedMotion = usePrefersReducedMotion();

  const panels = [
    { title: "Classic sets", copy: "Soft definition for an elegant everyday finish.", image: images.precision },
    { title: "Hybrid blends", copy: "The balance between texture and featherlight volume.", image: images.closeup },
    { title: "Volume artistry", copy: "Full-bodied drama designed to still feel weightless.", image: images.luxury },
    { title: "Refill rhythm", copy: "A maintenance cadence that keeps your look immaculate.", image: images.booking },
  ];

  const xPercent = prefersReducedMotion ? 0 : progress * (panels.length - 1) * -100;

  return (
    <section ref={chapterRef} className="relative h-[400vh] bg-black">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="flex h-full" style={{ width: `${panels.length * 100}vw`, transform: `translateX(${xPercent}vw)` }}>
          {panels.map((panel) => (
            <article key={panel.title} className="relative h-screen w-screen shrink-0">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.2)), url('${panel.image}')`,
                }}
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
      <section className="relative h-screen w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,.35), rgba(0,0,0,.8)), url('${images.hero}')`,
          }}
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col justify-between px-6 pb-14 pt-8 md:px-12 md:pb-20">
          <header className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.35em] text-white/75">LashBooker Studio</p>
            <Link href="/login" className="text-sm font-medium text-white/85 transition hover:text-white">
              Login
            </Link>
          </header>
          <div className="max-w-3xl">
            <h1 className="text-5xl font-semibold leading-tight md:text-8xl">Lash design in motion.</h1>
            <p className="mt-5 max-w-xl text-base text-white/80 md:text-xl">
              A cinematic, luxury booking experience crafted for clients who want precision styling and seamless service.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/book" className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-white/85">
                Book now
              </Link>
              <Link href="/policies" className="rounded-full border border-white/60 px-7 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10">
                View policies
              </Link>
            </div>
          </div>
        </div>
      </section>

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

      <section className="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 md:px-12">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,.82)), url('${images.booking}')`,
          }}
          aria-hidden
        />
        <div className="relative z-10 text-center">
          <h2 className="text-4xl font-semibold md:text-7xl">Ready for your next set?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-white/80 md:text-lg">
            Reserve your appointment in minutes and we&apos;ll guide you to the perfect service choice.
          </p>
          <Link href="/book" className="mt-8 inline-flex rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition hover:bg-white/85">
            Start booking
          </Link>
        </div>
      </section>

      <section className="flex h-screen w-full items-center justify-center bg-zinc-950 px-6 md:px-12">
        <div className="max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-white/65">Before you visit</p>
          <h2 className="mt-4 text-4xl font-semibold md:text-6xl">Studio policies</h2>
          <p className="mt-5 text-white/80 md:text-lg">
            Deposits, cancellation windows, and preparation guidance are all in one place.
          </p>
          <Link href="/policies" className="mt-8 inline-flex rounded-full border border-white/60 px-8 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10">
            Read policies
          </Link>
        </div>
      </section>
    </main>
  );
}
