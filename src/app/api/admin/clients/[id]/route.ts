import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "OWNER", "STAFF"];

const updateSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  contraindications: z.string().trim().max(5000).nullable().optional(),
});

async function guard() {
  const session = await auth();
  if (!session || !ADMIN_ROLES.includes(session.user.role)) return null;
  return session;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const client = await prisma.user.findFirst({
    where: { id: params.id, role: "CLIENT" },
    select: {
      id: true,
      email: true,
      createdAt: true,
      clientProfile: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          notes: true,
          contraindications: true,
          patchTestAt: true,
          updatedAt: true,
        },
      },
      bookings: {
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          serviceName: true,
        },
        orderBy: { startAt: "desc" },
        take: 30,
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  return NextResponse.json({ client });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const existing = await prisma.user.findFirst({
    where: { id: params.id, role: "CLIENT" },
    select: { id: true, clientProfile: { select: { id: true } } },
  });

  if (!existing?.clientProfile) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const updatedProfile = await prisma.clientProfile.update({
    where: { id: existing.clientProfile.id },
    data: {
      ...(parsed.data.firstName !== undefined ? { firstName: parsed.data.firstName } : {}),
      ...(parsed.data.lastName !== undefined ? { lastName: parsed.data.lastName } : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
      ...(parsed.data.contraindications !== undefined ? { contraindications: parsed.data.contraindications } : {}),
    },
  });

  return NextResponse.json({ profile: updatedProfile });
}
