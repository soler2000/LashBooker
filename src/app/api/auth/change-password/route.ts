import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const changePasswordSchema = z.object({
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  });

  return NextResponse.json({ ok: true });
}
