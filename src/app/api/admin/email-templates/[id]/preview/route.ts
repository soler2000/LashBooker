import {
  SAMPLE_TEMPLATE_VARIABLES,
  getAllowedPlaceholders,
  getAllowedUnescapedPlaceholders,
  renderTemplateString,
  sanitizeHtmlTemplate,
  validateTemplatePlaceholders,
  type TransactionalTemplateKey,
} from "@/lib/email-template-security";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const previewSchema = z
  .object({
    subject: z.string().trim().min(1).max(255),
    htmlBody: z.string().trim().min(1),
    textBody: z.string().trim().min(1),
  })
  .strict();

async function guard() {
  const session = await auth();
  return !!session && ["ADMIN", "OWNER"].includes(session.user.role);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!(await guard())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const template = await prisma.transactionalEmailTemplate.findUnique({
    where: { id: params.id },
  });

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = previewSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const templateKey = template.key as TransactionalTemplateKey;
  const allowUnescapedPlaceholders = new Set(getAllowedUnescapedPlaceholders(templateKey));
  const sanitizedHtmlBody = sanitizeHtmlTemplate(parsed.data.htmlBody);

  const placeholderViolations = validateTemplatePlaceholders({
    templateKey,
    subject: parsed.data.subject,
    htmlBody: sanitizedHtmlBody,
    textBody: parsed.data.textBody,
  });

  if (placeholderViolations.length > 0) {
    return NextResponse.json(
      { error: "Template contains invalid placeholders.", details: placeholderViolations },
      { status: 400 },
    );
  }

  const variables = SAMPLE_TEMPLATE_VARIABLES[templateKey];

  return NextResponse.json({
    key: template.key,
    name: template.name,
    allowedPlaceholders: getAllowedPlaceholders(templateKey),
    allowedUnescapedPlaceholders: getAllowedUnescapedPlaceholders(templateKey),
    sampleVariables: variables,
    rendered: {
      subject: renderTemplateString(parsed.data.subject, variables, { allowUnescapedPlaceholders }),
      htmlBody: sanitizeHtmlTemplate(
        renderTemplateString(sanitizedHtmlBody, variables, { allowUnescapedPlaceholders }),
      ),
      textBody: renderTemplateString(parsed.data.textBody, variables, { allowUnescapedPlaceholders }),
    },
  });
}
