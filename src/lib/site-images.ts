export const SITE_IMAGES_STORAGE_KEY = "lashbooker-main-images";

export const defaultSiteImages = {
  hero: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=2000&q=80",
  scene2Story: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=1800&q=80",
  scene3Story: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1800&q=80",
  chapterClassic: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1800&q=80",
  chapterHybrid: "https://images.unsplash.com/photo-1616391182219-e080b4d1043a?auto=format&fit=crop&w=1800&q=80",
  chapterVolume: "https://images.unsplash.com/photo-1631214540242-18f6cc5f0d0c?auto=format&fit=crop&w=1800&q=80",
  chapterRefill: "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1800&q=80",
  bookingCta: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1800&q=80",
  policies: "https://images.unsplash.com/photo-1583241800698-90a4f4d29f4a?auto=format&fit=crop&w=1800&q=80",
} as const;

export type SiteImageKey = keyof typeof defaultSiteImages;
export type SiteImages = Record<SiteImageKey, string>;

export const MAX_SITE_IMAGE_VALUE_LENGTH = 8_000_000;

export function sanitizeSiteImages(input: Partial<SiteImages> | null | undefined): SiteImages {
  const merged = { ...defaultSiteImages } as SiteImages;

  if (!input) {
    return merged;
  }

  for (const key of Object.keys(defaultSiteImages) as SiteImageKey[]) {
    const value = input[key];

    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();

    if (!trimmed || trimmed.length > MAX_SITE_IMAGE_VALUE_LENGTH) {
      continue;
    }

    merged[key] = trimmed;
  }

  return merged;
}

export const siteImageUsage: Record<SiteImageKey, { label: string; usedOn: string[] }> = {
  hero: { label: "Hero image", usedOn: ["/"] },
  scene2Story: { label: "Scene 2 story image", usedOn: ["/"] },
  scene3Story: { label: "Scene 3 story image", usedOn: ["/"] },
  chapterClassic: { label: "Horizontal chapter: Classic sets", usedOn: ["/"] },
  chapterHybrid: { label: "Horizontal chapter: Hybrid blends", usedOn: ["/"] },
  chapterVolume: { label: "Horizontal chapter: Volume artistry", usedOn: ["/"] },
  chapterRefill: { label: "Horizontal chapter: Refill rhythm", usedOn: ["/"] },
  bookingCta: { label: "Final booking CTA image", usedOn: ["/"] },
  policies: { label: "Policies panel image", usedOn: ["/policies"] },
};
