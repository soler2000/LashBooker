import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { buildUnsubscribeUrl, getSegmentRecipients } from "@/lib/marketing";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ADMIN_ROLES = ["ADMIN", "OWNER", "STAFF"];

function injectUnsubscribe(bodyHtml: string, unsubscribeUrl: string) {
  return `${bodyHtml}<hr/><p style="font-size:12px;color:#666">Unsubscribe: <a href="${unsubscribeUrl}">${unsubscribeUrl}</a></p>`;
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const recipients = await getSegmentRecipients(campaign.segmentType);

  await prisma.$transaction(async (tx) => {
    await tx.campaign.update({ where: { id }, data: { status: "SENDING" } });

    for (const recipient of recipients) {
      const unsubscribeUrl = buildUnsubscribeUrl(recipient.userId);
      const html = injectUnsubscribe(campaign.bodyHtml, unsubscribeUrl);
      const text = `${campaign.bodyText ?? ""}\n\nUnsubscribe: ${unsubscribeUrl}`.trim();

      const queued = await tx.campaignRecipient.upsert({
        where: { campaignId_clientId: { campaignId: id, clientId: recipient.userId } },
        update: {
          email: recipient.email,
          status: "QUEUED",
          failureReason: null,
          providerMessageId: null,
          queuedAt: new Date(),
        },
        create: {
          campaignId: id,
          clientId: recipient.userId,
          email: recipient.email,
          status: "QUEUED",
        },
      });

      const delivery = await sendEmail({
        to: recipient.email,
        subject: campaign.subject,
        html,
        text,
        metadata: { campaignId: campaign.id, campaignRecipientId: queued.id },
      });

      if (delivery.ok) {
        await tx.campaignRecipient.update({
          where: { id: queued.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            providerMessageId: delivery.providerMessageId,
          },
        });
      } else {
        await tx.campaignRecipient.update({
          where: { id: queued.id },
          data: {
            status: "FAILED",
            failureReason: delivery.error ?? "Unknown provider error",
          },
        });
      }
    }

    await tx.campaign.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });
  });

  const stats = await prisma.campaignRecipient.groupBy({
    by: ["status"],
    where: { campaignId: id },
    _count: { _all: true },
  });

  return NextResponse.json({ ok: true, stats });
}
