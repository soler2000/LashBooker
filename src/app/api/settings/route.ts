import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import { toPublicSettings } from "./public-settings";

export const dynamic = "force-dynamic";

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
      heroTitle: true,
      heroSubtitle: true,
      scene2Title: true,
      scene2Description: true,
      scene3Title: true,
      scene3Description: true,
      chapter1Title: true,
      chapter1Copy: true,
      chapter2Title: true,
      chapter2Copy: true,
      chapter3Title: true,
      chapter3Copy: true,
      chapter4Title: true,
      chapter4Copy: true,
      bookingCtaTitle: true,
      bookingCtaBody: true,
      qualificationCertificatesJson: true,
    },
  });

  return NextResponse.json(toPublicSettings(settings));
}
