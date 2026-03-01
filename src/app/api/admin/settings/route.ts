import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  defaultQualificationCertificates,
  sanitizeQualificationCertificates,
  type QualificationCertificateContent,
} from "@/lib/qualification-certificates";
import { NextResponse } from "next/server";
import {
  defaultSiteImages,
  sanitizeSiteImages,
  type SiteImages,
} from "@/lib/site-images";
import {
  adminSettingsUpdateSchema,
  type AdminSettingsUpdateInput,
  type HomepageContentFields,
} from "./schema";
import { defaultHomepageContent } from "../../settings/public-settings";

const roleAllowlist = ["ADMIN", "OWNER"];

async function guard() {
  const session = await auth();
  return !!session && roleAllowlist.includes(session.user.role);
}

async function ensureSettings() {
  const existing = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  if (existing) return existing;

  return prisma.businessSettings.create({
    data: {
      id: "default",
      businessName: "Lashed and Lifted",
      timezone: "Europe/London",
      currency: "gbp",
      depositDefaultType: "PERCENT",
      depositDefaultValue: 30,
      instagramUrl: null,
      contactPhone: null,
      contactEmail: null,
      addressLine1: null,
      addressLine2: null,
      addressCity: null,
      addressPostcode: null,
      addressCountry: null,
      qualificationCertificatesJson: JSON.stringify(defaultQualificationCertificates),
      siteImagesJson: JSON.stringify(defaultSiteImages),
      heroEyebrow: defaultHomepageContent.heroEyebrow,
      heroTitle: defaultHomepageContent.heroTitle,
      heroSubtitle: defaultHomepageContent.heroSubtitle,
      scene2Enabled: defaultHomepageContent.scene2Enabled,
      scene2Eyebrow: defaultHomepageContent.scene2Eyebrow,
      scene2Title: defaultHomepageContent.scene2Title,
      scene2Description: defaultHomepageContent.scene2Description,
      scene3Enabled: defaultHomepageContent.scene3Enabled,
      scene3Eyebrow: defaultHomepageContent.scene3Eyebrow,
      scene3Title: defaultHomepageContent.scene3Title,
      scene3Description: defaultHomepageContent.scene3Description,
      chapter1Title: defaultHomepageContent.chapter1Title,
      chapter1Copy: defaultHomepageContent.chapter1Copy,
      chapter2Title: defaultHomepageContent.chapter2Title,
      chapter2Copy: defaultHomepageContent.chapter2Copy,
      chapter3Title: defaultHomepageContent.chapter3Title,
      chapter3Copy: defaultHomepageContent.chapter3Copy,
      chapter4Title: defaultHomepageContent.chapter4Title,
      chapter4Copy: defaultHomepageContent.chapter4Copy,
      bookingCtaTitle: defaultHomepageContent.bookingCtaTitle,
      bookingCtaBody: defaultHomepageContent.bookingCtaBody,
      bookingCtaButtonLabel: defaultHomepageContent.bookingCtaButtonLabel,
      reminderScheduleJson: "[48,24]",
      smtpUseTls: false,
      smtpUseStarttls: false,
    },
  });
}

function parseSiteImages(siteImagesJson: string | null): SiteImages {
  if (!siteImagesJson) {
    return defaultSiteImages;
  }

  try {
    return sanitizeSiteImages(JSON.parse(siteImagesJson) as Partial<SiteImages>);
  } catch {
    return defaultSiteImages;
  }
}

function toHomepageContent(settings: {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  scene2Enabled: boolean;
  scene2Eyebrow: string;
  scene2Title: string;
  scene2Description: string;
  scene3Eyebrow: string;
  scene3Title: string;
  scene3Description: string;
  scene3Enabled: boolean;
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
}): HomepageContentFields {
  return {
    heroEyebrow: settings.heroEyebrow,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    scene2Enabled: settings.scene2Enabled,
    scene2Eyebrow: settings.scene2Eyebrow,
    scene2Title: settings.scene2Title,
    scene2Description: settings.scene2Description,
    scene3Eyebrow: settings.scene3Eyebrow,
    scene3Title: settings.scene3Title,
    scene3Description: settings.scene3Description,
    scene3Enabled: settings.scene3Enabled,
    chapter1Title: settings.chapter1Title,
    chapter1Copy: settings.chapter1Copy,
    chapter2Title: settings.chapter2Title,
    chapter2Copy: settings.chapter2Copy,
    chapter3Title: settings.chapter3Title,
    chapter3Copy: settings.chapter3Copy,
    chapter4Title: settings.chapter4Title,
    chapter4Copy: settings.chapter4Copy,
    bookingCtaTitle: settings.bookingCtaTitle,
    bookingCtaBody: settings.bookingCtaBody,
    bookingCtaButtonLabel: settings.bookingCtaButtonLabel,
  };
}

function toAdminResponse(settings: Awaited<ReturnType<typeof ensureSettings>>) {
  const qualificationCertificates = sanitizeQualificationCertificates(
    (() => {
      if (!settings.qualificationCertificatesJson) return null;
      try {
        return JSON.parse(settings.qualificationCertificatesJson) as QualificationCertificateContent[];
      } catch {
        return null;
      }
    })(),
  );

  return {
    depositRequired: settings.depositDefaultType !== "NONE",
    depositDefaultType: settings.depositDefaultType,
    depositDefaultValue: settings.depositDefaultValue,
    instagramUrl: settings.instagramUrl,
    contactPhone: settings.contactPhone,
    contactEmail: settings.contactEmail,
    addressLine1: settings.addressLine1,
    addressLine2: settings.addressLine2,
    addressCity: settings.addressCity,
    addressPostcode: settings.addressPostcode,
    addressCountry: settings.addressCountry,
    mailProviderType: settings.mailProviderType,
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpUsername: settings.smtpUsername,
    smtpSecretRef: settings.smtpSecretRef,
    mailFromName: settings.mailFromName,
    mailFromEmail: settings.mailFromEmail,
    mailReplyTo: settings.mailReplyTo,
    smtpUseTls: settings.smtpUseTls ?? false,
    smtpUseStarttls: settings.smtpUseStarttls ?? false,
    smtpPasswordConfigured: Boolean(settings.smtpPasswordEncrypted),
    siteImages: parseSiteImages(settings.siteImagesJson),
    qualificationCertificates,
    ...toHomepageContent(settings),
  };
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await ensureSettings();
  return NextResponse.json(toAdminResponse(settings));
}

export async function PUT(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = adminSettingsUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => {
        const field = issue.path.join(".") || "request";
        return `${field}: ${issue.message}`;
      })
      .join("; ");

    return NextResponse.json({ error: "Bad request", detail }, { status: 400 });
  }

  const existing = await ensureSettings();
  const data: Record<string, unknown> = {};
  const input = parsed.data as AdminSettingsUpdateInput;

  const assignIfPresent = <K extends keyof AdminSettingsUpdateInput>(key: K) => {
    if (typeof input[key] !== "undefined") {
      data[key] = input[key] ?? null;
    }
  };

  [
    "instagramUrl",
    "contactPhone",
    "contactEmail",
    "addressLine1",
    "addressLine2",
    "addressCity",
    "addressPostcode",
    "addressCountry",
    "mailProviderType",
    "smtpHost",
    "smtpPort",
    "smtpUsername",
    "smtpSecretRef",
    "mailFromName",
    "mailFromEmail",
    "mailReplyTo",
    "smtpUseTls",
    "smtpUseStarttls",
    "heroEyebrow",
    "heroTitle",
    "heroSubtitle",
    "scene2Enabled",
    "scene2Eyebrow",
    "scene2Title",
    "scene2Description",
    "scene3Eyebrow",
    "scene3Title",
    "scene3Description",
    "scene3Enabled",
    "chapter1Title",
    "chapter1Copy",
    "chapter2Title",
    "chapter2Copy",
    "chapter3Title",
    "chapter3Copy",
    "chapter4Title",
    "chapter4Copy",
    "bookingCtaTitle",
    "bookingCtaBody",
    "bookingCtaButtonLabel",
  ].forEach((key) => assignIfPresent(key as keyof AdminSettingsUpdateInput));

  if (typeof input.siteImages !== "undefined") {
    data.siteImagesJson = JSON.stringify(sanitizeSiteImages(input.siteImages));
  }

  if (typeof input.qualificationCertificates !== "undefined") {
    data.qualificationCertificatesJson = JSON.stringify(input.qualificationCertificates);
  }

  if (typeof input.smtpPassword !== "undefined") {
    data.smtpPasswordEncrypted = input.smtpPassword ? input.smtpPassword : null;
  }

  if (typeof input.depositRequired === "boolean") {
    data.depositDefaultType = input.depositRequired
      ? existing.depositDefaultType === "NONE"
        ? "PERCENT"
        : existing.depositDefaultType
      : "NONE";
    data.depositDefaultValue = input.depositRequired ? Math.max(existing.depositDefaultValue, 1) : 0;
  }

  const updated = await prisma.businessSettings.update({
    where: { id: "default" },
    data,
  });

  return NextResponse.json(toAdminResponse(updated));
}
