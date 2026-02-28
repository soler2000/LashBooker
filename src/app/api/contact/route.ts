import { NextResponse } from "next/server";
import { z } from "zod";

import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(320),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(3000),
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(request: Request) {
  const parsed = contactSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
  }

  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: { contactEmail: true },
  });

  const recipient = settings?.contactEmail?.trim();
  if (!recipient) {
    return NextResponse.json({ error: "Contact email is not configured." }, { status: 503 });
  }

  const { name, email, phone, message } = parsed.data;
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");

  const result = await sendEmail({
    to: recipient,
    subject: `New front-page contact request from ${name}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      "",
      "Message:",
      message,
    ].join("\n"),
    html: [
      `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`,
      `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
      `<p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>`,
      `<p><strong>Message:</strong><br />${safeMessage}</p>`,
    ].join(""),
    metadata: { source: "frontpage_contact" },
  });

  if (!result.ok) {
    return NextResponse.json({ error: "Could not send message right now." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
