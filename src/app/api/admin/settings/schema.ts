import { z } from "zod";

const MAX_URL_LENGTH = 2048;
const MAX_PHONE_LENGTH = 40;
const MAX_EMAIL_LENGTH = 320;
const MAX_ADDRESS_LINE_LENGTH = 120;
const MAX_ADDRESS_CITY_LENGTH = 80;
const MAX_ADDRESS_POSTCODE_LENGTH = 24;
const MAX_ADDRESS_COUNTRY_LENGTH = 80;
const MAX_CERTIFICATE_IMAGE_LENGTH = 2_000_000;
const MAX_HOMEPAGE_TITLE_LENGTH = 160;
const MAX_HOMEPAGE_COPY_LENGTH = 600;

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

export const updateSchema = z
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
    heroTitle: z.string().trim().min(1).max(MAX_HOMEPAGE_TITLE_LENGTH).optional(),
    heroSubtitle: z.string().trim().min(1).max(MAX_HOMEPAGE_COPY_LENGTH).optional(),
    scene2Title: z.string().trim().min(1).max(MAX_HOMEPAGE_TITLE_LENGTH).optional(),
    scene2Description: z.string().trim().min(1).max(MAX_HOMEPAGE_COPY_LENGTH).optional(),
    scene3Title: z.string().trim().min(1).max(MAX_HOMEPAGE_TITLE_LENGTH).optional(),
    scene3Description: z.string().trim().min(1).max(MAX_HOMEPAGE_COPY_LENGTH).optional(),
    chapter1Title: z.string().trim().min(1).max(MAX_HOMEPAGE_TITLE_LENGTH).optional(),
    chapter1Copy: z.string().trim().min(1).max(MAX_HOMEPAGE_COPY_LENGTH).optional(),
    chapter2Title: z.string().trim().min(1).max(MAX_HOMEPAGE_TITLE_LENGTH).optional(),
    chapter2Copy: z.string().trim().min(1).max(MAX_HOMEPAGE_COPY_LENGTH).optional(),
    chapter3Title: z.string().trim().min(1).max(MAX_HOMEPAGE_TITLE_LENGTH).optional(),
    chapter3Copy: z.string().trim().min(1).max(MAX_HOMEPAGE_COPY_LENGTH).optional(),
    chapter4Title: z.string().trim().min(1).max(MAX_HOMEPAGE_TITLE_LENGTH).optional(),
    chapter4Copy: z.string().trim().min(1).max(MAX_HOMEPAGE_COPY_LENGTH).optional(),
    bookingCtaTitle: z.string().trim().min(1).max(MAX_HOMEPAGE_TITLE_LENGTH).optional(),
    bookingCtaBody: z.string().trim().min(1).max(MAX_HOMEPAGE_COPY_LENGTH).optional(),
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
