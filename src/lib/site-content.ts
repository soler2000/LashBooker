export type SiteContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  scene2Enabled: boolean;
  scene2Eyebrow: string;
  scene2Title: string;
  scene2Description: string;
  scene3Enabled: boolean;
  scene3Eyebrow: string;
  scene3Title: string;
  scene3Description: string;
  chapter1Title: string;
  chapter1Copy: string;
  chapter2Title: string;
  chapter2Copy: string;
  chapter3Title: string;
  chapter3Copy: string;
  chapter4Title: string;
  chapter4Copy: string;
  bookingCtaTitle: string;
  bookingCtaBody: string;
  bookingCtaButtonLabel: string;
};

export const defaultSiteContent: SiteContent = {
  heroEyebrow: "Lashed and Lifted",
  heroTitle: "Lash design in motion.",
  heroSubtitle: "A cinematic, luxury booking experience crafted for clients who want precision styling and seamless service.",
  scene2Enabled: true,
  scene2Eyebrow: "Scene 2",
  scene2Title: "Designed around your features.",
  scene2Description: "Every appointment starts with personalized mapping so curl, density, and length complement your eyes-not overwhelm them.",
  scene3Enabled: true,
  scene3Eyebrow: "Scene 3",
  scene3Title: "Studio calm, editorial results.",
  scene3Description: "From consultation to final mirror reveal, each step is paced for comfort while delivering camera-ready detail.",
  chapter1Title: "Classic sets",
  chapter1Copy: "Soft definition for an elegant everyday finish.",
  chapter2Title: "Hybrid blends",
  chapter2Copy: "The balance between texture and featherlight volume.",
  chapter3Title: "Volume artistry",
  chapter3Copy: "Full-bodied drama designed to still feel weightless.",
  chapter4Title: "Refill rhythm",
  chapter4Copy: "A maintenance cadence that keeps your look immaculate.",
  bookingCtaTitle: "Ready for your next set?",
  bookingCtaBody: "Reserve your appointment in minutes and we'll guide you to the perfect service choice.",
  bookingCtaButtonLabel: "Start booking",
};

const MAX_COPY_LENGTH = 320;

function normalizeCopyValue(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, MAX_COPY_LENGTH);
}

function normalizeBooleanValue(value: unknown, fallback: boolean) {
  if (typeof value !== "boolean") return fallback;
  return value;
}

export function sanitizeSiteContent(value: unknown): SiteContent {
  if (!value || typeof value !== "object") {
    return defaultSiteContent;
  }

  const candidate = value as Partial<SiteContent>;

  return {
    heroEyebrow: normalizeCopyValue(candidate.heroEyebrow, defaultSiteContent.heroEyebrow),
    heroTitle: normalizeCopyValue(candidate.heroTitle, defaultSiteContent.heroTitle),
    heroSubtitle: normalizeCopyValue(candidate.heroSubtitle, defaultSiteContent.heroSubtitle),
    scene2Enabled: normalizeBooleanValue(candidate.scene2Enabled, defaultSiteContent.scene2Enabled),
    scene2Eyebrow: normalizeCopyValue(candidate.scene2Eyebrow, defaultSiteContent.scene2Eyebrow),
    scene2Title: normalizeCopyValue(candidate.scene2Title, defaultSiteContent.scene2Title),
    scene2Description: normalizeCopyValue(candidate.scene2Description, defaultSiteContent.scene2Description),
    scene3Enabled: normalizeBooleanValue(candidate.scene3Enabled, defaultSiteContent.scene3Enabled),
    scene3Eyebrow: normalizeCopyValue(candidate.scene3Eyebrow, defaultSiteContent.scene3Eyebrow),
    scene3Title: normalizeCopyValue(candidate.scene3Title, defaultSiteContent.scene3Title),
    scene3Description: normalizeCopyValue(candidate.scene3Description, defaultSiteContent.scene3Description),
    chapter1Title: normalizeCopyValue(candidate.chapter1Title, defaultSiteContent.chapter1Title),
    chapter1Copy: normalizeCopyValue(candidate.chapter1Copy, defaultSiteContent.chapter1Copy),
    chapter2Title: normalizeCopyValue(candidate.chapter2Title, defaultSiteContent.chapter2Title),
    chapter2Copy: normalizeCopyValue(candidate.chapter2Copy, defaultSiteContent.chapter2Copy),
    chapter3Title: normalizeCopyValue(candidate.chapter3Title, defaultSiteContent.chapter3Title),
    chapter3Copy: normalizeCopyValue(candidate.chapter3Copy, defaultSiteContent.chapter3Copy),
    chapter4Title: normalizeCopyValue(candidate.chapter4Title, defaultSiteContent.chapter4Title),
    chapter4Copy: normalizeCopyValue(candidate.chapter4Copy, defaultSiteContent.chapter4Copy),
    bookingCtaTitle: normalizeCopyValue(candidate.bookingCtaTitle, defaultSiteContent.bookingCtaTitle),
    bookingCtaBody: normalizeCopyValue(candidate.bookingCtaBody, defaultSiteContent.bookingCtaBody),
    bookingCtaButtonLabel: normalizeCopyValue(candidate.bookingCtaButtonLabel, defaultSiteContent.bookingCtaButtonLabel),
  };
}
