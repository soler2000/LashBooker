import { parseProviderWebhook } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = parseProviderWebhook(payload);

  if (!parsed?.messageId) {
    return NextResponse.json({ error: "Unsupported webhook payload" }, { status: 400 });
  }

  const existing = await prisma.campaignRecipient.findFirst({
    where: { providerMessageId: parsed.messageId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  await prisma.campaignRecipient.update({
    where: { id: existing.id },
    data: parsed.event === "OPENED"
      ? { status: "OPENED", openedAt: new Date() }
      : { status: "CLICKED", clickedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
