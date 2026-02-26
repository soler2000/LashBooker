import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const roleAllowlist = ["ADMIN", "OWNER"];

const updateSchema = z.object({
  depositRequired: z.boolean(),
});

async function guard() {
  const session = await auth();
  return !!session && roleAllowlist.includes(session.user.role);
}

async function ensureSettings() {
  const existing = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  if (existing) return existing;

  return prisma.businessSettings.create({
    data: {
      id: "default",
      businessName: "Lashed and Lifted",
      timezone: "Europe/London",
      currency: "gbp",
      depositDefaultType: "PERCENT",
      depositDefaultValue: 30,
      reminderScheduleJson: "[48,24]",
    },
  });
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await ensureSettings();
  return NextResponse.json({
    depositRequired: settings.depositDefaultType !== "NONE",
    depositDefaultType: settings.depositDefaultType,
    depositDefaultValue: settings.depositDefaultValue,
  });
}

export async function PUT(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const existing = await ensureSettings();
  const nextDepositType = parsed.data.depositRequired
    ? (existing.depositDefaultType === "NONE" ? "PERCENT" : existing.depositDefaultType)
    : "NONE";
  const nextDepositValue = parsed.data.depositRequired
    ? Math.max(existing.depositDefaultValue, 1)
    : 0;

  const updated = await prisma.businessSettings.update({
    where: { id: "default" },
    data: {
      depositDefaultType: nextDepositType,
      depositDefaultValue: nextDepositValue,
    },
  });

  return NextResponse.json({
    depositRequired: updated.depositDefaultType !== "NONE",
    depositDefaultType: updated.depositDefaultType,
    depositDefaultValue: updated.depositDefaultValue,
  });
}
