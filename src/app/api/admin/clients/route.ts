import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ADMIN_ROLES = ["ADMIN", "OWNER", "STAFF"];

function normalizeQuery(value: string | null) {
  return value?.trim() || "";
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const q = normalizeQuery(url.searchParams.get("q"));

  const clients = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { clientProfile: { firstName: { contains: q, mode: "insensitive" } } },
              { clientProfile: { lastName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
      clientProfile: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          notes: true,
        },
      },
    },
    orderBy: [{ clientProfile: { lastName: "asc" } }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json({ clients });
}
