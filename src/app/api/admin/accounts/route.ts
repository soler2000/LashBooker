import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createAccountSchema = z
  .object({
    email: z.string().trim().email().max(320),
    password: z.string().min(8).max(128),
    role: z.enum(["STAFF", "ADMIN", "OWNER"]),
    mustChangePassword: z.boolean().optional(),
  })
  .strict();

async function guard() {
  const session = await auth();
  return !!session?.user && session.user.role === "OWNER";
}

export async function POST(request: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createAccountSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already used" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const account = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      mustChangePassword: parsed.data.mustChangePassword ?? true,
    },
    select: {
      id: true,
      email: true,
      role: true,
      mustChangePassword: true,
      createdAt: true,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
