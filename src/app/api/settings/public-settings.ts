import {
  sanitizeQualificationCertificates,
  type QualificationCertificateContent,
} from "@/lib/qualification-certificates";

export type PublicSettingsInput = {
  instagramUrl?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressCity?: string | null;
  addressPostcode?: string | null;
  addressCountry?: string | null;
  heroTitle?: string;
  heroSubtitle?: string;
  scene2Title?: string;
  scene2Description?: string;
  scene3Title?: string;
  scene3Description?: string;
  chapter1Title?: string;
  chapter1Copy?: string;
  chapter2Title?: string;
  chapter2Copy?: string;
  chapter3Title?: string;
  chapter3Copy?: string;
  chapter4Title?: string;
  chapter4Copy?: string;
  bookingCtaTitle?: string;
  bookingCtaBody?: string;
  qualificationCertificatesJson?: string | null;
};

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildContactAndAddress(settings: PublicSettingsInput | null | undefined) {
  return {
    contactPhone: normalizeOptionalText(settings?.contactPhone),
    contactEmail: normalizeOptionalText(settings?.contactEmail),
    addressLine1: normalizeOptionalText(settings?.addressLine1),
    addressLine2: normalizeOptionalText(settings?.addressLine2),
    addressCity: normalizeOptionalText(settings?.addressCity),
    addressPostcode: normalizeOptionalText(settings?.addressPostcode),
    addressCountry: normalizeOptionalText(settings?.addressCountry),
  };
}

function buildHomepageCopy(settings: PublicSettingsInput | null | undefined) {
  return {
    heroTitle: settings?.heroTitle,
    heroSubtitle: settings?.heroSubtitle,
    scene2Title: settings?.scene2Title,
    scene2Description: settings?.scene2Description,
    scene3Title: settings?.scene3Title,
    scene3Description: settings?.scene3Description,
    chapter1Title: settings?.chapter1Title,
    chapter1Copy: settings?.chapter1Copy,
    chapter2Title: settings?.chapter2Title,
    chapter2Copy: settings?.chapter2Copy,
    chapter3Title: settings?.chapter3Title,
    chapter3Copy: settings?.chapter3Copy,
    chapter4Title: settings?.chapter4Title,
    chapter4Copy: settings?.chapter4Copy,
    bookingCtaTitle: settings?.bookingCtaTitle,
    bookingCtaBody: settings?.bookingCtaBody,
  };
}

export function toPublicSettings(settings: PublicSettingsInput | null | undefined) {
  const publicContactAndAddress = buildContactAndAddress(settings);
  const homepageCopy = buildHomepageCopy(settings);
  const normalizedInstagramUrl = normalizeOptionalText(settings?.instagramUrl);
  const qualificationCertificates = sanitizeQualificationCertificates(
    (() => {
      if (!settings?.qualificationCertificatesJson) return null;
      try {
        return JSON.parse(settings.qualificationCertificatesJson) as QualificationCertificateContent[];
      } catch {
        return null;
      }
    })(),
  );

  if (!normalizedInstagramUrl) {
    return { instagramUrl: null, qualificationCertificates, ...publicContactAndAddress, ...homepageCopy };
  }

  try {
    const candidate = new URL(normalizedInstagramUrl);
    if (!["http:", "https:"].includes(candidate.protocol)) {
      return { instagramUrl: null, qualificationCertificates, ...publicContactAndAddress, ...homepageCopy };
    }

    return { instagramUrl: candidate.toString(), qualificationCertificates, ...publicContactAndAddress, ...homepageCopy };
  } catch {
    return { instagramUrl: null, qualificationCertificates, ...publicContactAndAddress, ...homepageCopy };
  }
}
