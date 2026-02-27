import {
  getAllowedPlaceholders,
  getAllowedUnescapedPlaceholders,
  type TransactionalTemplateKey,
} from "@/lib/email-template-security";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function guard() {
  const session = await auth();
  return !!session && ["ADMIN", "OWNER"].includes(session.user.role);
}

export async function GET() {
  if (!(await guard())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const templates = await prisma.transactionalEmailTemplate.findMany({
    orderBy: [{ name: "asc" }],
  });

  return NextResponse.json(
    templates.map((template) => {
      const templateKey = template.key as TransactionalTemplateKey;
      return {
        ...template,
        allowedPlaceholders: getAllowedPlaceholders(templateKey),
        allowedUnescapedPlaceholders: getAllowedUnescapedPlaceholders(templateKey),
      };
    }),
  );
}
