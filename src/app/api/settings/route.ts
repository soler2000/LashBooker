import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function toPublicSettings(instagramUrl: string | null | undefined) {
  if (!instagramUrl) {
    return { instagramUrl: null };
  }

  try {
    const candidate = new URL(instagramUrl);
    if (!["http:", "https:"].includes(candidate.protocol)) {
      return { instagramUrl: null };
    }

    return { instagramUrl: candidate.toString() };
  } catch {
    return { instagramUrl: null };
  }
}

export async function GET() {
  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: { instagramUrl: true },
  });

  return NextResponse.json(toPublicSettings(settings?.instagramUrl));
}
