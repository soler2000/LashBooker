import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1),
  unit: z.string().trim().max(30).optional().or(z.literal("")),
  targetStock: z.number().int().nonnegative(),
  currentStock: z.number().int().nonnegative(),
});

async function guard() {
  const session = await auth();
  return !!session && ["ADMIN", "OWNER", "STAFF"].includes(session.user.role);
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const consumables = await prisma.consumable.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ consumables });
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const created = await prisma.consumable.create({
    data: {
      ...parsed.data,
      unit: parsed.data.unit?.trim() || null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
