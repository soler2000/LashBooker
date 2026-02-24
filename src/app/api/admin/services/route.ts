import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  priceCents: z.number().int().positive(),
  depositType: z.enum(["NONE", "FIXED", "PERCENT"]),
  depositValue: z.number().int().nonnegative(),
  bufferBeforeMinutes: z.number().int().nonnegative().default(0),
  bufferAfterMinutes: z.number().int().nonnegative().default(0),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !["ADMIN", "OWNER", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const created = await prisma.service.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}
