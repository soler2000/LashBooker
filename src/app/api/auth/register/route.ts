import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { trimPasswordEdges } from "@/lib/password";
import { sendTemplatedEmail } from "@/lib/email";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: "Email already used" }, { status: 409 });

  const passwordHash = await bcrypt.hash(trimPasswordEdges(parsed.data.password), 10);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      role: "CLIENT",
      clientProfile: {
        create: {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
        },
      },
    },
  });

  const accountCreatedEmail = await sendTemplatedEmail({
    to: parsed.data.email,
    templateKey: "account_created",
    variables: {
      firstName: parsed.data.firstName,
      email: parsed.data.email,
    },
    metadata: { userId: user.id, type: "account_created" },
  });

  if (!accountCreatedEmail.ok) {
    console.warn(JSON.stringify({
      event: "account_created_email_failed",
      userId: user.id,
      email: parsed.data.email,
      ...accountCreatedEmail,
    }));
  }

  return NextResponse.json({ id: user.id }, { status: 201 });
}
