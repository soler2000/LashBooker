import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const roleAllowlist = ["ADMIN", "OWNER"];

const MAX_URL_LENGTH = 2048;

function normalizeInstagramUrl(value: string | null | undefined) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

const updateSchema = z
  .object({
    depositRequired: z.boolean().optional(),
    instagramUrl: z.preprocess(
      (value) => normalizeInstagramUrl(value as string | null | undefined),
      z.string().url().max(MAX_URL_LENGTH).nullable().optional(),
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
      reminderScheduleJson: "[48,24]",
      smtpUseTls: false,
      smtpUseStarttls: false,
    },
  });
}

function toPublicResponse(settings: Awaited<ReturnType<typeof ensureSettings>>) {
  return {
    depositRequired: settings.depositDefaultType !== "NONE",
    depositDefaultType: settings.depositDefaultType,
    depositDefaultValue: settings.depositDefaultValue,
    instagramUrl: settings.instagramUrl,
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
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const existing = await ensureSettings();

  const data: Record<string, unknown> = {};

  const assignIfPresent = <K extends keyof typeof parsed.data>(key: K) => {
    if (typeof parsed.data[key] !== "undefined") {
      data[key] = parsed.data[key] ?? null;
    }
  };

  assignIfPresent("instagramUrl");
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
