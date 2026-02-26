import { auth } from "@/lib/auth";
import { parseSegmentType } from "@/lib/marketing";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "OWNER", "STAFF"];

const createCampaignSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  bodyText: z.string().optional(),
  segmentType: z.string().min(1),
});

export async function GET() {
  const session = await auth();
  if (!session || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const campaigns = await prisma.campaign.findMany({
    include: {
      _count: { select: { recipients: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const segmentType = parseSegmentType(parsed.data.segmentType);
  if (!segmentType) {
    return NextResponse.json({ error: "Unsupported segment type" }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: parsed.data.name,
      subject: parsed.data.subject,
      bodyHtml: parsed.data.bodyHtml,
      bodyText: parsed.data.bodyText,
      segmentType,
    },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
