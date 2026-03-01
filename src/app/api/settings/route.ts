import { prisma } from "@/lib/prisma";
import {
  sanitizeQualificationCertificates,
  type QualificationCertificateContent,
} from "@/lib/qualification-certificates";
import { NextResponse } from "next/server";
import { defaultSiteImages, sanitizeSiteImages, type SiteImages } from "@/lib/site-images";
import { defaultSiteContent, sanitizeSiteContent, type SiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

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
  siteContentJson?: string | null;
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

function parseSiteImages(siteImagesJson: string | null | undefined): SiteImages {
  if (!siteImagesJson) return defaultSiteImages;

  try {
    return sanitizeSiteImages(JSON.parse(siteImagesJson) as Partial<SiteImages>);
  } catch {
    return defaultSiteImages;
  }
}


function parseSiteContent(siteContentJson: string | null | undefined): SiteContent {
  if (!siteContentJson) return defaultSiteContent;

  try {
    return sanitizeSiteContent(JSON.parse(siteContentJson));
  } catch {
    return defaultSiteContent;
  }
}

function toPublicSettings(settings: PublicSettingsInput | null | undefined) {
  const publicContactAndAddress = buildContactAndAddress(settings);
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

  const siteImages = parseSiteImages(settings?.siteImagesJson);
  const siteContent = parseSiteContent(settings?.siteContentJson);

  if (!normalizedInstagramUrl) {
    return { instagramUrl: null, siteImages, siteContent, qualificationCertificates, ...publicContactAndAddress };
  }

  try {
    const candidate = new URL(normalizedInstagramUrl);
    if (!["http:", "https:"].includes(candidate.protocol)) {
      return { instagramUrl: null, siteImages, siteContent, qualificationCertificates, ...publicContactAndAddress };
    }

    return { instagramUrl: candidate.toString(), siteImages, siteContent, qualificationCertificates, ...publicContactAndAddress };
  } catch {
    return { instagramUrl: null, siteImages, siteContent, qualificationCertificates, ...publicContactAndAddress };
  }
}

export async function GET() {
  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: {
      instagramUrl: true,
      contactPhone: true,
      contactEmail: true,
      addressLine1: true,
      addressLine2: true,
      addressCity: true,
      addressPostcode: true,
      addressCountry: true,
      qualificationCertificatesJson: true,
      siteImagesJson: true,
      siteContentJson: true,
    },
  });

  return NextResponse.json(toPublicSettings(settings));
}
