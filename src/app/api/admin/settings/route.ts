import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  defaultQualificationCertificates,
  sanitizeQualificationCertificates,
  type QualificationCertificateContent,
} from "@/lib/qualification-certificates";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  defaultSiteImages,
  MAX_HERO_VIDEO_DATA_URL_LENGTH,
  MAX_SITE_IMAGE_VALUE_LENGTH,
  sanitizeSiteImages,
  type SiteImages,
} from "@/lib/site-images";
import { defaultSiteContent, sanitizeSiteContent, type SiteContent } from "@/lib/site-content";

const roleAllowlist = ["ADMIN", "OWNER"];

const MAX_URL_LENGTH = 2048;
const MAX_PHONE_LENGTH = 40;
const MAX_EMAIL_LENGTH = 320;
const MAX_ADDRESS_LINE_LENGTH = 120;
const MAX_ADDRESS_CITY_LENGTH = 80;
const MAX_ADDRESS_POSTCODE_LENGTH = 24;
const MAX_ADDRESS_COUNTRY_LENGTH = 80;
const MAX_CERTIFICATE_IMAGE_LENGTH = 2_000_000;
const MAX_COPY_LENGTH = 320;

function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeInstagramUrl(value: string | null | undefined) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}


const siteImagesSchema = z.object({
  hero: z
    .string()
    .trim()
    .min(1)
    .max(MAX_HERO_VIDEO_DATA_URL_LENGTH)
    .refine(
      (value) => !value.startsWith("data:video/mp4") || value.length <= MAX_HERO_VIDEO_DATA_URL_LENGTH,
      "Hero MP4 uploads must be 10MB or smaller.",
    )
    .refine(
      (value) => value.startsWith("data:video/mp4") || value.length <= MAX_SITE_IMAGE_VALUE_LENGTH,
      "Hero image is too large.",
    ),
  scene2Story: z.string().trim().min(1).max(MAX_SITE_IMAGE_VALUE_LENGTH),
  scene3Story: z.string().trim().min(1).max(MAX_SITE_IMAGE_VALUE_LENGTH),
  chapterClassic: z.string().trim().min(1).max(MAX_SITE_IMAGE_VALUE_LENGTH),
  chapterHybrid: z.string().trim().min(1).max(MAX_SITE_IMAGE_VALUE_LENGTH),
  chapterVolume: z.string().trim().min(1).max(MAX_SITE_IMAGE_VALUE_LENGTH),
  chapterRefill: z.string().trim().min(1).max(MAX_SITE_IMAGE_VALUE_LENGTH),
  bookingCta: z.string().trim().min(1).max(MAX_SITE_IMAGE_VALUE_LENGTH),
  policies: z.string().trim().min(1).max(MAX_SITE_IMAGE_VALUE_LENGTH),
});


const chapterPanelSchema = z.object({
  title: z.string().trim().min(1).max(MAX_COPY_LENGTH),
  copy: z.string().trim().min(1).max(MAX_COPY_LENGTH),
});

const siteContentSchema = z.object({
  heroEyebrow: z.string().trim().min(1).max(MAX_COPY_LENGTH),
  heroTitle: z.string().trim().min(1).max(MAX_COPY_LENGTH),
  heroDescription: z.string().trim().min(1).max(MAX_COPY_LENGTH),
  scene2Eyebrow: z.string().trim().min(1).max(MAX_COPY_LENGTH),
  scene2Title: z.string().trim().min(1).max(MAX_COPY_LENGTH),
  scene2Description: z.string().trim().min(1).max(MAX_COPY_LENGTH),
  scene3Eyebrow: z.string().trim().min(1).max(MAX_COPY_LENGTH),
  scene3Title: z.string().trim().min(1).max(MAX_COPY_LENGTH),
  scene3Description: z.string().trim().min(1).max(MAX_COPY_LENGTH),
  chapterClassic: chapterPanelSchema,
  chapterHybrid: chapterPanelSchema,
  chapterVolume: chapterPanelSchema,
  chapterRefill: chapterPanelSchema,
  bookingCtaTitle: z.string().trim().min(1).max(MAX_COPY_LENGTH),
  bookingCtaDescription: z.string().trim().min(1).max(MAX_COPY_LENGTH),
  bookingCtaButtonLabel: z.string().trim().min(1).max(MAX_COPY_LENGTH),
});

const updateSchema = z
  .object({
    depositRequired: z.boolean().optional(),
    instagramUrl: z.preprocess(
      (value) => normalizeInstagramUrl(value as string | null | undefined),
      z.string().url().max(MAX_URL_LENGTH).nullable().optional(),
    ),
    contactPhone: z.preprocess(
      (value) => normalizeOptionalText(value as string | null | undefined),
      z.string().max(MAX_PHONE_LENGTH).nullable().optional(),
    ),
    contactEmail: z.preprocess(
      (value) => normalizeOptionalText(value as string | null | undefined),
      z.string().email().max(MAX_EMAIL_LENGTH).nullable().optional(),
    ),
    addressLine1: z.preprocess(
      (value) => normalizeOptionalText(value as string | null | undefined),
      z.string().max(MAX_ADDRESS_LINE_LENGTH).nullable().optional(),
    ),
    addressLine2: z.preprocess(
      (value) => normalizeOptionalText(value as string | null | undefined),
      z.string().max(MAX_ADDRESS_LINE_LENGTH).nullable().optional(),
    ),
    addressCity: z.preprocess(
      (value) => normalizeOptionalText(value as string | null | undefined),
      z.string().max(MAX_ADDRESS_CITY_LENGTH).nullable().optional(),
    ),
    addressPostcode: z.preprocess(
      (value) => normalizeOptionalText(value as string | null | undefined),
      z.string().max(MAX_ADDRESS_POSTCODE_LENGTH).nullable().optional(),
    ),
    addressCountry: z.preprocess(
      (value) => normalizeOptionalText(value as string | null | undefined),
      z.string().max(MAX_ADDRESS_COUNTRY_LENGTH).nullable().optional(),
    ),
    mailProviderType: z.string().trim().max(64).nullable().optional(),
    smtpHost: z.string().trim().max(255).nullable().optional(),
    smtpPort: z.number().int().min(1).max(65535).nullable().optional(),
    smtpUsername: z.string().trim().max(255).nullable().optional(),
    smtpPassword: z.string().max(512).nullable().optional(),
    smtpSecretRef: z.string().trim().max(255).nullable().optional(),
    mailFromName: z.string().trim().max(255).nullable().optional(),
    mailFromEmail: z.string().trim().email().max(320).nullable().optional(),
    mailReplyTo: z.string().trim().email().max(320).nullable().optional(),
    smtpUseTls: z.boolean().nullable().optional(),
    smtpUseStarttls: z.boolean().nullable().optional(),
    siteImages: siteImagesSchema.optional(),
    siteContent: siteContentSchema.optional(),
    qualificationCertificates: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(120),
          description: z.string().trim().min(1).max(320),
          image: z.string().trim().min(1).max(MAX_CERTIFICATE_IMAGE_LENGTH).optional(),
        }),
      )
      .min(1)
      .max(6)
      .optional(),
  })
  .strict();

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
      siteContentJson: JSON.stringify(defaultSiteContent),
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


function parseSiteContent(siteContentJson: string | null): SiteContent {
  if (!siteContentJson) {
    return defaultSiteContent;
  }

  try {
    return sanitizeSiteContent(JSON.parse(siteContentJson));
  } catch {
    return defaultSiteContent;
  }
}

function toPublicResponse(settings: Awaited<ReturnType<typeof ensureSettings>>) {
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
    siteContent: parseSiteContent(settings.siteContentJson),
    qualificationCertificates,
  };
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await ensureSettings();
  return NextResponse.json(toPublicResponse(settings));
}

export async function PUT(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = updateSchema.safeParse(await request.json());
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

  const assignIfPresent = <K extends keyof typeof parsed.data>(key: K) => {
    if (typeof parsed.data[key] !== "undefined") {
      data[key] = parsed.data[key] ?? null;
    }
  };

  assignIfPresent("instagramUrl");
  assignIfPresent("contactPhone");
  assignIfPresent("contactEmail");
  assignIfPresent("addressLine1");
  assignIfPresent("addressLine2");
  assignIfPresent("addressCity");
  assignIfPresent("addressPostcode");
  assignIfPresent("addressCountry");
  assignIfPresent("mailProviderType");
  assignIfPresent("smtpHost");
  assignIfPresent("smtpPort");
  assignIfPresent("smtpUsername");
  assignIfPresent("smtpSecretRef");
  assignIfPresent("mailFromName");
  assignIfPresent("mailFromEmail");
  assignIfPresent("mailReplyTo");
  assignIfPresent("smtpUseTls");
  assignIfPresent("smtpUseStarttls");

  if (typeof parsed.data.siteImages !== "undefined") {
    data.siteImagesJson = JSON.stringify(sanitizeSiteImages(parsed.data.siteImages));
  }

  if (typeof parsed.data.qualificationCertificates !== "undefined") {
    data.qualificationCertificatesJson = JSON.stringify(parsed.data.qualificationCertificates);
  }

  if (typeof parsed.data.siteContent !== "undefined") {
    data.siteContentJson = JSON.stringify(sanitizeSiteContent(parsed.data.siteContent));
  }

  if (typeof parsed.data.smtpPassword !== "undefined") {
    data.smtpPasswordEncrypted = parsed.data.smtpPassword ? parsed.data.smtpPassword : null;
  }

  if (typeof parsed.data.depositRequired === "boolean") {
    data.depositDefaultType = parsed.data.depositRequired
      ? existing.depositDefaultType === "NONE"
        ? "PERCENT"
        : existing.depositDefaultType
      : "NONE";
    data.depositDefaultValue = parsed.data.depositRequired ? Math.max(existing.depositDefaultValue, 1) : 0;
  }

  const updated = await prisma.businessSettings.update({
    where: { id: "default" },
    data,
  });

  return NextResponse.json(toPublicResponse(updated));
}
