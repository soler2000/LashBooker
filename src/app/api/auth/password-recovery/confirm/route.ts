import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { trimPasswordEdges } from "@/lib/password";
import { sendTemplatedEmail } from "@/lib/email";

const confirmSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  token: z.string().min(16),
  password: z.string().min(8),
});

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  const parsed = confirmSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const tokenHash = hashToken(parsed.data.token);
  const tokenRecord = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: parsed.data.email,
        token: tokenHash,
      },
    },
  });

  if (!tokenRecord || tokenRecord.expires < new Date()) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(trimPasswordEdges(parsed.data.password), 10);

  const updatedUser = await prisma.user.update({
    where: { email: parsed.data.email },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
    include: { clientProfile: true },
  });

  await prisma.verificationToken.deleteMany({ where: { identifier: parsed.data.email } });

  const passwordChangedEmail = await sendTemplatedEmail({
    to: updatedUser.email,
    templateKey: "password_changed",
    variables: {
      firstName: updatedUser.clientProfile?.firstName || "there",
      email: updatedUser.email,
    },
    metadata: { userId: updatedUser.id, type: "password_changed_via_recovery" },
  });

  if (!passwordChangedEmail.ok) {
    console.warn(JSON.stringify({
      event: "password_changed_email_failed",
      userId: updatedUser.id,
      email: updatedUser.email,
      ...passwordChangedEmail,
    }));
  }

  return NextResponse.json({ ok: true });
}
