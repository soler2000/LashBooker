import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z
  .object({
    subject: z.string().trim().min(1).max(255),
    htmlBody: z.string().trim().min(1),
    textBody: z.string().trim().min(1),
    isActive: z.boolean(),
  })
  .strict();

async function guard() {
  const session = await auth();
  return !!session && ["ADMIN", "OWNER"].includes(session.user.role);
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const template = await prisma.transactionalEmailTemplate.findUnique({
    where: { id: params.id },
  });

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(template);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    const updated = await prisma.transactionalEmailTemplate.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
