import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableSlots, getWeeklyAvailableSlots } from "@/lib/availability";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const singleDayQuery = z.object({ serviceId: z.string().uuid(), date: dateString });
const weeklyQuery = z.object({ serviceId: z.string().uuid(), startDate: dateString, days: z.coerce.number().int().min(1).max(31).default(7) });

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());

  if (params.startDate || params.days) {
    const parsed = weeklyQuery.safeParse(params);
    if (!parsed.success) return NextResponse.json({ error: "Bad query" }, { status: 400 });

    const days = await getWeeklyAvailableSlots(parsed.data.serviceId, parsed.data.startDate, parsed.data.days);
    return NextResponse.json({ days });
  }

  const parsed = singleDayQuery.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "Bad query" }, { status: 400 });

  const slots = await getAvailableSlots(parsed.data.serviceId, parsed.data.date);
  return NextResponse.json(slots);
}
