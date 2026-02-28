import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  defaultQualificationCertificates,
  sanitizeQualificationCertificates,
  type QualificationCertificateContent,
} from "@/lib/qualification-certificates";
import { NextResponse } from "next/server";

import { updateSchema } from "./schema";

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
      heroTitle: "Lash design in motion.",
      heroSubtitle:
        "A cinematic, luxury booking experience crafted for clients who want precision styling and seamless service.",
      scene2Title: "Designed around your features.",
      scene2Description:
        "Every appointment starts with personalized mapping so curl, density, and length complement your eyes—not overwhelm them.",
      scene3Title: "Studio calm, editorial results.",
      scene3Description:
        "From consultation to final mirror reveal, each step is paced for comfort while delivering camera-ready detail.",
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
      qualificationCertificatesJson: JSON.stringify(defaultQualificationCertificates),
      reminderScheduleJson: "[48,24]",
      smtpUseTls: false,
      smtpUseStarttls: false,
    },
  });
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
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    scene2Title: settings.scene2Title,
    scene2Description: settings.scene2Description,
    scene3Title: settings.scene3Title,
    scene3Description: settings.scene3Description,
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
  assignIfPresent("heroTitle");
  assignIfPresent("heroSubtitle");
  assignIfPresent("scene2Title");
  assignIfPresent("scene2Description");
  assignIfPresent("scene3Title");
  assignIfPresent("scene3Description");
  assignIfPresent("chapter1Title");
  assignIfPresent("chapter1Copy");
  assignIfPresent("chapter2Title");
  assignIfPresent("chapter2Copy");
  assignIfPresent("chapter3Title");
  assignIfPresent("chapter3Copy");
  assignIfPresent("chapter4Title");
  assignIfPresent("chapter4Copy");
  assignIfPresent("bookingCtaTitle");
  assignIfPresent("bookingCtaBody");
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

  if (typeof parsed.data.qualificationCertificates !== "undefined") {
    data.qualificationCertificatesJson = JSON.stringify(parsed.data.qualificationCertificates);
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
