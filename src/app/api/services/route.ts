import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const services = await prisma.service.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(services);
}
