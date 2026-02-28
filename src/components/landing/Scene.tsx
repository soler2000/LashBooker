"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { isVideoAsset } from "@/lib/media";

type SceneProps = {
  children: ReactNode;
  image?: string;
  overlay?: string;
  imagePriority?: boolean;
  imageSizes?: string;
  sectionClassName?: string;
  contentClassName?: string;
};

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function usePrefersReducedMotion() {
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

export function useSectionProgress(ref: RefObject<HTMLElement>) {
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

export default function Scene({
  children,
  image,
  overlay = "linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,.82))",
  imagePriority = false,
  imageSizes = "100vw",
  sectionClassName = "relative h-screen w-full overflow-hidden",
  contentClassName = "relative z-10",
}: SceneProps) {
  const isVideo = image ? isVideoAsset(image) : false;

  return (
    <section className={sectionClassName}>
      {image ? (
        <>
          <div className="absolute inset-0" aria-hidden>
            {isVideo ? (
              <video
                src={image}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
                preload={imagePriority ? "auto" : "metadata"}
              />
            ) : (
              <Image src={image} alt="" fill className="object-cover" sizes={imageSizes} priority={imagePriority} />
            )}
          </div>
          <div className="absolute inset-0" style={{ backgroundImage: overlay }} aria-hidden />
        </>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
