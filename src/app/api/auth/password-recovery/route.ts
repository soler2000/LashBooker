import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendTemplatedEmail } from "@/lib/email";

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

function resolveAppUrl(request: Request) {
  const envBase = process.env.NEXTAUTH_URL || process.env.APP_URL;
  if (envBase) return envBase.replace(/\/$/, "");
  return new URL(request.url).origin;
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { clientProfile: true },
  });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.verificationToken.deleteMany({ where: { identifier: user.email } });
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: tokenHash,
        expires,
      },
    });

    const resetUrl = `${resolveAppUrl(req)}/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(user.email)}`;
    const recoveryEmail = await sendTemplatedEmail({
      to: user.email,
      templateKey: "password_recovery",
      variables: {
        firstName: user.clientProfile?.firstName || "there",
        email: user.email,
        resetUrl,
        expiresAt: expires,
      },
      metadata: { userId: user.id, type: "password_recovery" },
    });

    if (!recoveryEmail.ok) {
      console.warn(JSON.stringify({
        event: "password_recovery_email_failed",
        userId: user.id,
        email: user.email,
        ...recoveryEmail,
      }));
    }
  }

  return NextResponse.json({ ok: true });
}
