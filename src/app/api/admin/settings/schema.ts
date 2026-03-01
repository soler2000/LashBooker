import { z } from "zod";

const MAX_URL_LENGTH = 2048;
const MAX_PHONE_LENGTH = 40;
const MAX_EMAIL_LENGTH = 320;
const MAX_ADDRESS_LINE_LENGTH = 120;
const MAX_ADDRESS_CITY_LENGTH = 80;
const MAX_ADDRESS_POSTCODE_LENGTH = 24;
const MAX_ADDRESS_COUNTRY_LENGTH = 80;
const MAX_CERTIFICATE_IMAGE_LENGTH = 2_000_000;
const MAX_COPY_LENGTH = 320;

export type HomepageContentFields = {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  scene2Eyebrow: string;
  scene2Title: string;
  scene2Description: string;
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

function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeInstagramUrl(value: string | null | undefined) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const contentField = z.string().trim().min(1).max(MAX_COPY_LENGTH);

export const adminSettingsUpdateSchema = z
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
    heroEyebrow: contentField.optional(),
    heroTitle: contentField.optional(),
    heroSubtitle: contentField.optional(),
    scene2Eyebrow: contentField.optional(),
    scene2Title: contentField.optional(),
    scene2Description: contentField.optional(),
    scene3Eyebrow: contentField.optional(),
    scene3Title: contentField.optional(),
    scene3Description: contentField.optional(),
    chapter1Title: contentField.optional(),
    chapter1Copy: contentField.optional(),
    chapter2Title: contentField.optional(),
    chapter2Copy: contentField.optional(),
    chapter3Title: contentField.optional(),
    chapter3Copy: contentField.optional(),
    chapter4Title: contentField.optional(),
    chapter4Copy: contentField.optional(),
    bookingCtaTitle: contentField.optional(),
    bookingCtaBody: contentField.optional(),
    bookingCtaButtonLabel: contentField.optional(),
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
    siteImages: z
      .object({
        hero: z.string().trim().min(1),
        scene2Story: z.string().trim().min(1),
        scene3Story: z.string().trim().min(1),
        chapterClassic: z.string().trim().min(1),
        chapterHybrid: z.string().trim().min(1),
        chapterVolume: z.string().trim().min(1),
        chapterRefill: z.string().trim().min(1),
        bookingCta: z.string().trim().min(1),
        policies: z.string().trim().min(1),
      })
      .optional(),
  })
  .strict();

export type AdminSettingsUpdateInput = z.infer<typeof adminSettingsUpdateSchema>;
