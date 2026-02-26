import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trimPasswordEdges } from "@/lib/password";

const createAccountSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(320),
    password: z.string().min(8).max(128),
    role: z.enum(["STAFF", "ADMIN", "OWNER"]),
    mustChangePassword: z.boolean().optional(),
  })
  .strict();

async function guard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    return null;
  }

  return session.user;
}

export async function GET() {
  const user = await guard();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const accounts = await prisma.user.findMany({
    where: {
      role: { in: ["STAFF", "ADMIN", "OWNER"] },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      role: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(accounts);
}

export async function POST(request: Request) {
  const user = await guard();
  if (!user) {
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

  const passwordHash = await bcrypt.hash(trimPasswordEdges(parsed.data.password), 10);

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
