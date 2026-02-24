import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableSlots } from "@/lib/availability";

const query = z.object({ serviceId: z.string().uuid(), date: z.string() });

export async function GET(req: Request) {
  const parsed = query.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Bad query" }, { status: 400 });

  const slots = await getAvailableSlots(parsed.data.serviceId, parsed.data.date);
  return NextResponse.json(slots);
}
