export type HorizontalChapterPanelContent = {
  title: string;
  copy: string;
};

export type SiteContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  scene2Eyebrow: string;
  scene2Title: string;
  scene2Description: string;
  scene3Eyebrow: string;
  scene3Title: string;
  scene3Description: string;
  chapterClassic: HorizontalChapterPanelContent;
  chapterHybrid: HorizontalChapterPanelContent;
  chapterVolume: HorizontalChapterPanelContent;
  chapterRefill: HorizontalChapterPanelContent;
  bookingCtaTitle: string;
  bookingCtaDescription: string;
  bookingCtaButtonLabel: string;
};

export const defaultSiteContent: SiteContent = {
  heroEyebrow: "Lashed and Lifted",
  heroTitle: "Lash design in motion.",
  heroDescription:
    "A cinematic, luxury booking experience crafted for clients who want precision styling and seamless service.",
  scene2Eyebrow: "Scene 2",
  scene2Title: "Designed around your features.",
  scene2Description:
    "Every appointment starts with personalized mapping so curl, density, and length complement your eyes—not overwhelm them.",
  scene3Eyebrow: "Scene 3",
  scene3Title: "Studio calm, editorial results.",
  scene3Description:
    "From consultation to final mirror reveal, each step is paced for comfort while delivering camera-ready detail.",
  chapterClassic: {
    title: "Classic sets",
    copy: "Soft definition for an elegant everyday finish.",
  },
  chapterHybrid: {
    title: "Hybrid blends",
    copy: "The balance between texture and featherlight volume.",
  },
  chapterVolume: {
    title: "Volume artistry",
    copy: "Full-bodied drama designed to still feel weightless.",
  },
  chapterRefill: {
    title: "Refill rhythm",
    copy: "A maintenance cadence that keeps your look immaculate.",
  },
  bookingCtaTitle: "Ready for your next set?",
  bookingCtaDescription:
    "Reserve your appointment in minutes and we'll guide you to the perfect service choice.",
  bookingCtaButtonLabel: "Start booking",
};

const MAX_COPY_LENGTH = 320;

function normalizeCopyValue(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, MAX_COPY_LENGTH);
}

function sanitizePanelContent(value: unknown, fallback: HorizontalChapterPanelContent): HorizontalChapterPanelContent {
  if (!value || typeof value !== "object") return fallback;

  const candidate = value as Partial<HorizontalChapterPanelContent>;

  return {
    title: normalizeCopyValue(candidate.title, fallback.title),
    copy: normalizeCopyValue(candidate.copy, fallback.copy),
  };
}

export function sanitizeSiteContent(value: unknown): SiteContent {
  if (!value || typeof value !== "object") {
    return defaultSiteContent;
  }

  const candidate = value as Partial<SiteContent>;

  return {
    heroEyebrow: normalizeCopyValue(candidate.heroEyebrow, defaultSiteContent.heroEyebrow),
    heroTitle: normalizeCopyValue(candidate.heroTitle, defaultSiteContent.heroTitle),
    heroDescription: normalizeCopyValue(candidate.heroDescription, defaultSiteContent.heroDescription),
    scene2Eyebrow: normalizeCopyValue(candidate.scene2Eyebrow, defaultSiteContent.scene2Eyebrow),
    scene2Title: normalizeCopyValue(candidate.scene2Title, defaultSiteContent.scene2Title),
    scene2Description: normalizeCopyValue(candidate.scene2Description, defaultSiteContent.scene2Description),
    scene3Eyebrow: normalizeCopyValue(candidate.scene3Eyebrow, defaultSiteContent.scene3Eyebrow),
    scene3Title: normalizeCopyValue(candidate.scene3Title, defaultSiteContent.scene3Title),
    scene3Description: normalizeCopyValue(candidate.scene3Description, defaultSiteContent.scene3Description),
    chapterClassic: sanitizePanelContent(candidate.chapterClassic, defaultSiteContent.chapterClassic),
    chapterHybrid: sanitizePanelContent(candidate.chapterHybrid, defaultSiteContent.chapterHybrid),
    chapterVolume: sanitizePanelContent(candidate.chapterVolume, defaultSiteContent.chapterVolume),
    chapterRefill: sanitizePanelContent(candidate.chapterRefill, defaultSiteContent.chapterRefill),
    bookingCtaTitle: normalizeCopyValue(candidate.bookingCtaTitle, defaultSiteContent.bookingCtaTitle),
    bookingCtaDescription: normalizeCopyValue(candidate.bookingCtaDescription, defaultSiteContent.bookingCtaDescription),
    bookingCtaButtonLabel: normalizeCopyValue(candidate.bookingCtaButtonLabel, defaultSiteContent.bookingCtaButtonLabel),
  };
}
