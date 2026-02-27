import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

function toPublicSettings(settings: PublicSettingsInput | null | undefined) {
  const publicContactAndAddress = buildContactAndAddress(settings);
  const normalizedInstagramUrl = normalizeOptionalText(settings?.instagramUrl);

  if (!normalizedInstagramUrl) {
    return { instagramUrl: null, ...publicContactAndAddress };
  }

  try {
    const candidate = new URL(normalizedInstagramUrl);
    if (!["http:", "https:"].includes(candidate.protocol)) {
      return { instagramUrl: null, ...publicContactAndAddress };
    }

    return { instagramUrl: candidate.toString(), ...publicContactAndAddress };
  } catch {
    return { instagramUrl: null, ...publicContactAndAddress };
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
    },
  });

  return NextResponse.json(toPublicSettings(settings));
}
