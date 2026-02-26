export const SITE_IMAGES_STORAGE_KEY = "lashbooker-main-images";

export const defaultSiteImages = {
  hero: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=2000&q=80",
  precision: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=1800&q=80",
  closeup: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1800&q=80",
  luxury: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1800&q=80",
  booking: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1800&q=80",
  policies: "https://images.unsplash.com/photo-1583241800698-90a4f4d29f4a?auto=format&fit=crop&w=1800&q=80",
} as const;

export type SiteImageKey = keyof typeof defaultSiteImages;
export type SiteImages = Record<SiteImageKey, string>;
