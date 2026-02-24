import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const services = await prisma.service.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
    return NextResponse.json(services);
  } catch (error) {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          error: "Server misconfiguration: DATABASE_URL is not set.",
        },
        { status: 503 },
      );
    }

    console.error("Failed to fetch services", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}
