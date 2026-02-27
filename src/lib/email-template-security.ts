const TRANSACTIONAL_TEMPLATE_KEYS = [
  "account_created",
  "password_changed",
  "password_recovery",
  "booking_confirmed",
  "booking_cancellation_confirmed",
  "booking_change_confirmed",
  "booking_reminder",
  "missed_booking_notification",
] as const;

export type TransactionalTemplateKey = (typeof TRANSACTIONAL_TEMPLATE_KEYS)[number];

type TemplateVariables = Record<string, string | number | boolean | null | undefined | Date>;

type PlaceholderPolicy = {
  allowed: readonly string[];
  allowUnescaped?: readonly string[];
};

const TEMPLATE_PLACEHOLDER_POLICY: Record<TransactionalTemplateKey, PlaceholderPolicy> = {
  account_created: { allowed: ["firstName", "email"] },
  password_changed: { allowed: ["firstName", "email"] },
  password_recovery: { allowed: ["firstName", "email", "resetUrl", "expiresAt"] },
  booking_confirmed: { allowed: ["firstName", "bookingId", "serviceName", "startAt"] },
  booking_cancellation_confirmed: { allowed: ["firstName", "bookingId", "serviceName", "startAt"] },
  booking_change_confirmed: { allowed: ["firstName", "bookingId", "serviceName", "startAt"] },
  booking_reminder: { allowed: ["firstName", "bookingId", "serviceName", "startAt"] },
  missed_booking_notification: { allowed: ["firstName", "bookingId", "serviceName", "startAt"] },
};

export const SAMPLE_TEMPLATE_VARIABLES: Record<TransactionalTemplateKey, TemplateVariables> = {
  account_created: {
    firstName: "Ava",
    email: "ava.client@example.com",
  },
  password_changed: {
    firstName: "Ava",
    email: "ava.client@example.com",
  },
  password_recovery: {
    firstName: "Ava",
    email: "ava.client@example.com",
    resetUrl: "https://example.com/reset?token=preview",
    expiresAt: "2026-01-15T10:00:00.000Z",
  },
  booking_confirmed: {
    firstName: "Ava",
    bookingId: "BK-1024",
    serviceName: "Classic Full Set",
    startAt: "2026-01-15T10:00:00.000Z",
  },
  booking_cancellation_confirmed: {
    firstName: "Ava",
    bookingId: "BK-1024",
    serviceName: "Classic Full Set",
    startAt: "2026-01-15T10:00:00.000Z",
  },
  booking_change_confirmed: {
    firstName: "Ava",
    bookingId: "BK-1024",
    serviceName: "Classic Full Set",
    startAt: "2026-01-15T10:00:00.000Z",
  },
  booking_reminder: {
    firstName: "Ava",
    bookingId: "BK-1024",
    serviceName: "Classic Full Set",
    startAt: "2026-01-15T10:00:00.000Z",
  },
  missed_booking_notification: {
    firstName: "Ava",
    bookingId: "BK-1024",
    serviceName: "Classic Full Set",
    startAt: "2026-01-15T10:00:00.000Z",
  },
};

function normalizeTemplateValue(value: TemplateVariables[string]): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderTemplateString(
  template: string,
  variables: TemplateVariables,
  options?: { allowUnescapedPlaceholders?: ReadonlySet<string> },
): string {
  const allowUnescaped = options?.allowUnescapedPlaceholders ?? new Set<string>();

  return template.replace(/{{{\s*([\w.-]+)\s*}}}|{{\s*([\w.-]+)\s*}}/g, (_match, rawKey: string, escapedKey: string) => {
    const key = rawKey || escapedKey;
    const value = normalizeTemplateValue(variables[key]);

    if (rawKey && allowUnescaped.has(key)) {
      return value;
    }

    return escapeHtml(value);
  });
}

const disallowedTagPattern = /<(script|style|iframe|object|embed|meta|link|base)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const disallowedSelfClosingPattern = /<(script|style|iframe|object|embed|meta|link|base)\b[^>]*\/?\s*>/gi;
const allowedTags = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

const allowedAttributes: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
};

function sanitizeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("/") || value.startsWith("#")) return value;
  const lower = value.toLowerCase();
  if (lower.startsWith("https://") || lower.startsWith("http://") || lower.startsWith("mailto:") || lower.startsWith("tel:")) {
    return value;
  }
  return null;
}

export function sanitizeHtmlTemplate(html: string): string {
  const withoutDangerousTags = html.replace(disallowedTagPattern, "").replace(disallowedSelfClosingPattern, "");

  return withoutDangerousTags.replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (match, rawTagName: string, rawAttrs: string) => {
    const tagName = rawTagName.toLowerCase();
    if (!allowedTags.has(tagName)) return "";

    const isClosing = match.startsWith("</");
    if (isClosing) return `</${tagName}>`;

    const allowedForTag = allowedAttributes[tagName] ?? new Set<string>();
    const attrs: string[] = [];

    for (const attrMatch of rawAttrs.matchAll(/([\w:-]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g)) {
      const attrName = attrMatch[1].toLowerCase();
      if (!allowedForTag.has(attrName)) continue;

      const valueToken = attrMatch[2];
      const unwrapped = valueToken ? valueToken.replace(/^['"]|['"]$/g, "") : "";
      const safeValue = attrName === "href" || attrName === "src" ? sanitizeUrl(unwrapped) : unwrapped;
      if (safeValue === null) continue;
      attrs.push(`${attrName}="${escapeHtml(safeValue)}"`);
    }

    if (tagName === "a" && attrs.some((attr) => attr === 'target="_blank"') && !attrs.some((attr) => attr.startsWith("rel="))) {
      attrs.push('rel="noopener noreferrer"');
    }

    const suffix = attrs.length ? ` ${attrs.join(" ")}` : "";
    return `<${tagName}${suffix}>`;
  });
}

export function getAllowedPlaceholders(templateKey: TransactionalTemplateKey): string[] {
  return [...TEMPLATE_PLACEHOLDER_POLICY[templateKey].allowed];
}

export function getAllowedUnescapedPlaceholders(templateKey: TransactionalTemplateKey): string[] {
  return [...(TEMPLATE_PLACEHOLDER_POLICY[templateKey].allowUnescaped ?? [])];
}

export function validateTemplatePlaceholders(input: {
  templateKey: TransactionalTemplateKey;
  subject: string;
  htmlBody: string;
  textBody: string;
}): string[] {
  const policy = TEMPLATE_PLACEHOLDER_POLICY[input.templateKey];
  const allowed = new Set(policy.allowed);
  const allowedUnescaped = new Set(policy.allowUnescaped ?? []);
  const violations: string[] = [];

  const fields: Array<[string, string]> = [
    ["subject", input.subject],
    ["htmlBody", input.htmlBody],
    ["textBody", input.textBody],
  ];

  for (const [fieldName, value] of fields) {
    for (const match of value.matchAll(/{{{\s*([\w.-]+)\s*}}}|{{\s*([\w.-]+)\s*}}/g)) {
      const token = match[1] || match[2];
      const isUnescaped = Boolean(match[1]);

      if (!allowed.has(token)) {
        violations.push(`Field '${fieldName}' uses disallowed placeholder '{{${token}}}'.`);
        continue;
      }

      if (isUnescaped && !allowedUnescaped.has(token)) {
        violations.push(`Field '${fieldName}' uses unescaped placeholder '{{{${token}}}}' which is not permitted.`);
      }
    }
  }

  return violations;
}
