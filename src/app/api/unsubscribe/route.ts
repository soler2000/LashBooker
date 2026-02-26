import { verifyUnsubscribeToken } from "@/lib/marketing";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || "";

  const userId = verifyUnsubscribeToken(token);
  if (!userId) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.clientProfile.updateMany({
      where: { userId },
      data: { marketingConsent: false },
    }),
    prisma.campaignRecipient.updateMany({
      where: { clientId: userId },
      data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true, message: "You have been unsubscribed." });
}
