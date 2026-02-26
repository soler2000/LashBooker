import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.workingHours.findMany({
    orderBy: { weekday: "asc" },
    select: { weekday: true, startTime: true, endTime: true, isClosed: true },
  });

  return NextResponse.json(rows);
}
