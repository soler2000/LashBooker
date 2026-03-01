import {
  defaultQualificationCertificates,
  sanitizeQualificationCertificates,
  type QualificationCertificateContent,
} from "@/lib/qualification-certificates";
import { defaultSiteImages, sanitizeSiteImages, type SiteImages } from "@/lib/site-images";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";

type PublicSettingsInput = {
  instagramUrl?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressCity?: string | null;
  addressPostcode?: string | null;
  addressCountry?: string | null;
  qualificationCertificatesJson?: string | null;
  siteImagesJson?: string | null;
  heroEyebrow?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  scene2Enabled?: boolean | null;
  scene2Eyebrow?: string | null;
  scene2Title?: string | null;
  scene2Description?: string | null;
  scene3Enabled?: boolean | null;
  scene3Eyebrow?: string | null;
  scene3Title?: string | null;
  scene3Description?: string | null;
  chapter1Title?: string | null;
  chapter1Copy?: string | null;
  chapter2Title?: string | null;
  chapter2Copy?: string | null;
  chapter3Title?: string | null;
  chapter3Copy?: string | null;
  chapter4Title?: string | null;
  chapter4Copy?: string | null;
  bookingCtaTitle?: string | null;
  bookingCtaBody?: string | null;
  bookingCtaButtonLabel?: string | null;
};

export const defaultHomepageContent: SiteContent = defaultSiteContent;

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeCopy(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function normalizeBoolean(value: boolean | null | undefined, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function toPublicSettings(settings: PublicSettingsInput | null | undefined) {
  const qualificationCertificates = sanitizeQualificationCertificates(
    (() => {
      if (!settings?.qualificationCertificatesJson) return defaultQualificationCertificates;
      try {
        return JSON.parse(settings.qualificationCertificatesJson) as QualificationCertificateContent[];
      } catch {
        return defaultQualificationCertificates;
      }
    })(),
  );

  const homepageContent = {
    heroEyebrow: normalizeCopy(settings?.heroEyebrow, defaultHomepageContent.heroEyebrow),
    heroTitle: normalizeCopy(settings?.heroTitle, defaultHomepageContent.heroTitle),
    heroSubtitle: normalizeCopy(settings?.heroSubtitle, defaultHomepageContent.heroSubtitle),
    scene2Enabled: normalizeBoolean(settings?.scene2Enabled, defaultHomepageContent.scene2Enabled),
    scene2Eyebrow: normalizeCopy(settings?.scene2Eyebrow, defaultHomepageContent.scene2Eyebrow),
    scene2Title: normalizeCopy(settings?.scene2Title, defaultHomepageContent.scene2Title),
    scene2Description: normalizeCopy(settings?.scene2Description, defaultHomepageContent.scene2Description),
    scene3Enabled: normalizeBoolean(settings?.scene3Enabled, defaultHomepageContent.scene3Enabled),
    scene3Eyebrow: normalizeCopy(settings?.scene3Eyebrow, defaultHomepageContent.scene3Eyebrow),
    scene3Title: normalizeCopy(settings?.scene3Title, defaultHomepageContent.scene3Title),
    scene3Description: normalizeCopy(settings?.scene3Description, defaultHomepageContent.scene3Description),
    chapter1Title: normalizeCopy(settings?.chapter1Title, defaultHomepageContent.chapter1Title),
    chapter1Copy: normalizeCopy(settings?.chapter1Copy, defaultHomepageContent.chapter1Copy),
    chapter2Title: normalizeCopy(settings?.chapter2Title, defaultHomepageContent.chapter2Title),
    chapter2Copy: normalizeCopy(settings?.chapter2Copy, defaultHomepageContent.chapter2Copy),
    chapter3Title: normalizeCopy(settings?.chapter3Title, defaultHomepageContent.chapter3Title),
    chapter3Copy: normalizeCopy(settings?.chapter3Copy, defaultHomepageContent.chapter3Copy),
    chapter4Title: normalizeCopy(settings?.chapter4Title, defaultHomepageContent.chapter4Title),
    chapter4Copy: normalizeCopy(settings?.chapter4Copy, defaultHomepageContent.chapter4Copy),
    bookingCtaTitle: normalizeCopy(settings?.bookingCtaTitle, defaultHomepageContent.bookingCtaTitle),
    bookingCtaBody: normalizeCopy(settings?.bookingCtaBody, defaultHomepageContent.bookingCtaBody),
    bookingCtaButtonLabel: normalizeCopy(settings?.bookingCtaButtonLabel, defaultHomepageContent.bookingCtaButtonLabel),
  };

  return {
    instagramUrl: normalizeOptionalText(settings?.instagramUrl),
    contactPhone: normalizeOptionalText(settings?.contactPhone),
    contactEmail: normalizeOptionalText(settings?.contactEmail),
    addressLine1: normalizeOptionalText(settings?.addressLine1),
    addressLine2: normalizeOptionalText(settings?.addressLine2),
    addressCity: normalizeOptionalText(settings?.addressCity),
    addressPostcode: normalizeOptionalText(settings?.addressPostcode),
    addressCountry: normalizeOptionalText(settings?.addressCountry),
    qualificationCertificates,
    siteImages: (() => {
      if (!settings?.siteImagesJson) return defaultSiteImages;
      try {
        return sanitizeSiteImages(JSON.parse(settings.siteImagesJson) as Partial<SiteImages>);
      } catch {
        return defaultSiteImages;
      }
    })(),
    homepageContent,
  };
}
