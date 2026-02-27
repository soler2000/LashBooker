import crypto from "node:crypto";
import net from "node:net";
import tls from "node:tls";

import { prisma } from "@/lib/prisma";

export type DeliveryResult = {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
  errorCode?: "CONFIGURATION" | "AUTH" | "CONNECTION" | "TIMEOUT" | "RATE_LIMIT" | "UNKNOWN";
  retryable?: boolean;
};

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  metadata?: Record<string, string>;
};

export type ProviderWebhookEvent = {
  messageId?: string;
  event: "OPENED" | "CLICKED";
};

type TemplateVariables = Record<string, string | number | boolean | null | undefined | Date>;

type TransactionalTemplateKey =
  | "account_created"
  | "password_changed"
  | "password_recovery"
  | "booking_confirmed"
  | "booking_cancellation_confirmed"
  | "booking_change_confirmed"
  | "booking_reminder"
  | "missed_booking_notification";

type ResolvedTransport =
  | {
      provider: "SMTP";
      host: string;
      port: number;
      username?: string;
      password?: string;
      fromEmail?: string;
      fromName?: string;
      replyTo?: string;
      useTls: boolean;
      useStarttls: boolean;
    }
  | { provider: "LOG" };

type SmtpResponse = { code: number; lines: string[] };

function readBooleanEnv(value: string | undefined): boolean | undefined {
  if (typeof value === "undefined") return undefined;
  return value.trim().toLowerCase() === "true";
}

function normalizeTemplateValue(value: TemplateVariables[string]): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function renderTemplateString(template: string, variables: TemplateVariables): string {
  return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_match, key: string) => {
    return normalizeTemplateValue(variables[key]);
  });
}

async function resolveTransport(): Promise<ResolvedTransport> {
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const provider =
    (settings?.mailProviderType || process.env.EMAIL_PROVIDER || "LOG").trim().toUpperCase();

  if (provider === "SMTP") {
    const host = settings?.smtpHost || process.env.SMTP_HOST;
    const portRaw = settings?.smtpPort ?? (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined);

    if (!host || !portRaw || Number.isNaN(portRaw)) return { provider: "LOG" };

    return {
      provider: "SMTP",
      host,
      port: portRaw,
      username: settings?.smtpUsername || process.env.SMTP_USERNAME,
      password: settings?.smtpPasswordEncrypted || process.env.SMTP_PASSWORD,
      fromEmail: settings?.mailFromEmail || process.env.SMTP_FROM_EMAIL,
      fromName: settings?.mailFromName || process.env.SMTP_FROM_NAME,
      replyTo: settings?.mailReplyTo || process.env.SMTP_REPLY_TO,
      useTls: settings?.smtpUseTls ?? readBooleanEnv(process.env.SMTP_USE_TLS) ?? false,
      useStarttls:
        settings?.smtpUseStarttls ?? readBooleanEnv(process.env.SMTP_USE_STARTTLS) ?? false,
    };
  }

  return { provider: "LOG" };
}

function normalizeEmailError(error: unknown): Pick<DeliveryResult, "error" | "errorCode" | "retryable"> {
  if (error instanceof Error) {
    const code = ((error as Error & { code?: string }).code || "").toUpperCase();
    if (code.includes("EAUTH") || error.message.includes("535")) {
      return { error: error.message, errorCode: "AUTH", retryable: false };
    }
    if (code.includes("ETIMEDOUT") || code.includes("ETIMEOUT")) {
      return { error: error.message, errorCode: "TIMEOUT", retryable: true };
    }
    if (code.includes("ECONNECTION") || code.includes("ECONNREFUSED") || code.includes("ENOTFOUND")) {
      return { error: error.message, errorCode: "CONNECTION", retryable: true };
    }
    if (error.message.includes("421") || error.message.includes("429")) {
      return { error: error.message, errorCode: "RATE_LIMIT", retryable: true };
    }
    return { error: error.message, errorCode: "UNKNOWN", retryable: true };
  }

  return {
    error: "Email delivery failed due to an unknown provider error.",
    errorCode: "UNKNOWN",
    retryable: true,
  };
}

async function sendViaLog(input: SendEmailInput): Promise<DeliveryResult> {
  const providerMessageId = `log_${crypto.randomUUID()}`;
  console.log(JSON.stringify({ event: "email_send", provider: "LOG", ...input, providerMessageId }));
  return { ok: true, providerMessageId };
}

function waitForResponse(socket: net.Socket | tls.TLSSocket): Promise<SmtpResponse> {
  return new Promise((resolve, reject) => {
    let buffer = "";

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split("\r\n").filter(Boolean);
      if (!lines.length) return;
      const last = lines.at(-1);
      if (!last || !/^\d{3} /.test(last)) return;

      cleanup();
      resolve({ code: Number(last.slice(0, 3)), lines });
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const onTimeout = () => {
      cleanup();
      const error = new Error("SMTP timeout");
      (error as Error & { code: string }).code = "ETIMEDOUT";
      reject(error);
    };

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("timeout", onTimeout);
    };

    socket.on("data", onData);
    socket.on("error", onError);
    socket.on("timeout", onTimeout);
  });
}

async function sendCommand(socket: net.Socket | tls.TLSSocket, command: string, expectedCodes: number[]) {
  socket.write(`${command}\r\n`);
  const response = await waitForResponse(socket);
  if (!expectedCodes.includes(response.code)) {
    throw new Error(`SMTP command failed (${command}): ${response.lines.join(" | ")}`);
  }
  return response;
}

function buildMimeMessage(input: SendEmailInput, from: string, replyTo?: string) {
  const boundary = `boundary_${crypto.randomUUID()}`;
  const headers = [
    `From: ${from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];

  if (replyTo) headers.push(`Reply-To: ${replyTo}`);
  if (input.metadata) {
    Object.entries(input.metadata).forEach(([key, value]) => headers.push(`X-Meta-${key}: ${value}`));
  }

  const textBody = input.text || input.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  return [
    ...headers,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    textBody,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    input.html,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

async function connectSmtp(transport: Extract<ResolvedTransport, { provider: "SMTP" }>) {
  if (transport.useTls) {
    const socket = tls.connect({ host: transport.host, port: transport.port, rejectUnauthorized: false });
    socket.setTimeout(15_000);
    await new Promise<void>((resolve, reject) => {
      socket.once("secureConnect", () => resolve());
      socket.once("error", reject);
    });
    return socket;
  }

  const socket = net.connect({ host: transport.host, port: transport.port });
  socket.setTimeout(15_000);
  await new Promise<void>((resolve, reject) => {
    socket.once("connect", () => resolve());
    socket.once("error", reject);
  });
  return socket;
}

async function sendViaSmtp(input: SendEmailInput, transport: Extract<ResolvedTransport, { provider: "SMTP" }>): Promise<DeliveryResult> {
  if (!transport.fromEmail) {
    return {
      ok: false,
      error: "SMTP from address is missing. Configure mailFromEmail or SMTP_FROM_EMAIL.",
      errorCode: "CONFIGURATION",
      retryable: false,
    };
  }

  const from = transport.fromName
    ? `"${transport.fromName.replace(/"/g, "")}" <${transport.fromEmail}>`
    : transport.fromEmail;

  const socket = await connectSmtp(transport);

  try {
    await waitForResponse(socket);
    await sendCommand(socket, "EHLO lashbooker.local", [250]);

    if (!transport.useTls && transport.useStarttls) {
      await sendCommand(socket, "STARTTLS", [220]);
      const secureSocket = tls.connect({ socket, rejectUnauthorized: false });
      await new Promise<void>((resolve, reject) => {
        secureSocket.once("secureConnect", () => resolve());
        secureSocket.once("error", reject);
      });
      secureSocket.setTimeout(15_000);

      await sendCommand(secureSocket, "EHLO lashbooker.local", [250]);

      if (transport.username && transport.password) {
        await sendCommand(secureSocket, "AUTH LOGIN", [334]);
        await sendCommand(secureSocket, Buffer.from(transport.username).toString("base64"), [334]);
        await sendCommand(secureSocket, Buffer.from(transport.password).toString("base64"), [235]);
      }

      await sendCommand(secureSocket, `MAIL FROM:<${transport.fromEmail}>`, [250]);
      await sendCommand(secureSocket, `RCPT TO:<${input.to}>`, [250, 251]);
      await sendCommand(secureSocket, "DATA", [354]);

      const messageId = `<${crypto.randomUUID()}@${transport.host}>`;
      const mime = `${buildMimeMessage(input, from, transport.replyTo)}\r\nMessage-ID: ${messageId}\r\n.\r\n`;
      secureSocket.write(mime);
      const dataResponse = await waitForResponse(secureSocket);
      if (dataResponse.code !== 250) {
        throw new Error(`SMTP DATA failed: ${dataResponse.lines.join(" | ")}`);
      }
      await sendCommand(secureSocket, "QUIT", [221]);
      return { ok: true, providerMessageId: messageId };
    }

    if (transport.username && transport.password) {
      await sendCommand(socket, "AUTH LOGIN", [334]);
      await sendCommand(socket, Buffer.from(transport.username).toString("base64"), [334]);
      await sendCommand(socket, Buffer.from(transport.password).toString("base64"), [235]);
    }

    await sendCommand(socket, `MAIL FROM:<${transport.fromEmail}>`, [250]);
    await sendCommand(socket, `RCPT TO:<${input.to}>`, [250, 251]);
    await sendCommand(socket, "DATA", [354]);

    const messageId = `<${crypto.randomUUID()}@${transport.host}>`;
    const mime = `${buildMimeMessage(input, from, transport.replyTo)}\r\nMessage-ID: ${messageId}\r\n.\r\n`;
    socket.write(mime);
    const dataResponse = await waitForResponse(socket);
    if (dataResponse.code !== 250) {
      throw new Error(`SMTP DATA failed: ${dataResponse.lines.join(" | ")}`);
    }

    await sendCommand(socket, "QUIT", [221]);
    return { ok: true, providerMessageId: messageId };
  } finally {
    socket.end();
  }
}

export async function sendEmail(input: SendEmailInput): Promise<DeliveryResult> {
  try {
    const transport = await resolveTransport();

    if (transport.provider === "SMTP") {
      return await sendViaSmtp(input, transport);
    }

    return await sendViaLog(input);
  } catch (error) {
    const normalized = normalizeEmailError(error);
    console.error(JSON.stringify({ event: "email_send_failed", ...normalized, to: input.to }));
    return { ok: false, ...normalized };
  }
}

export async function sendTemplatedEmail(input: {
  to: string;
  templateKey: TransactionalTemplateKey;
  variables: TemplateVariables;
  metadata?: Record<string, string>;
}): Promise<DeliveryResult> {
  const template = await prisma.transactionalEmailTemplate.findUnique({
    where: { key: input.templateKey },
  });

  if (!template || !template.isActive) {
    return {
      ok: false,
      error: `Transactional template '${input.templateKey}' is missing or inactive`,
      errorCode: "CONFIGURATION",
      retryable: false,
    };
  }

  return sendEmail({
    to: input.to,
    subject: renderTemplateString(template.subject, input.variables),
    html: renderTemplateString(template.htmlBody, input.variables),
    text: renderTemplateString(template.textBody, input.variables),
    metadata: {
      ...input.metadata,
      templateKey: input.templateKey,
    },
  });
}


export async function hasSuccessfulTransactionalEmailLog(dedupeKey: string): Promise<boolean> {
  const existing = await prisma.transactionalEmailLog.findFirst({
    where: { dedupeKey, status: "SENT" },
    select: { id: true },
  });

  return !!existing;
}

export async function sendLoggedTransactionalEmail(input: {
  to: string;
  templateKey: TransactionalTemplateKey;
  variables: TemplateVariables;
  metadata?: Record<string, string>;
  recipientUserId?: string;
  bookingId?: string;
  dedupeKey?: string;
}): Promise<DeliveryResult & { skipped?: boolean }> {
  if (input.dedupeKey) {
    const alreadySent = await hasSuccessfulTransactionalEmailLog(input.dedupeKey);
    if (alreadySent) {
      return { ok: true, skipped: true };
    }
  }

  const log = await prisma.transactionalEmailLog.create({
    data: {
      templateKey: input.templateKey,
      recipientEmail: input.to,
      recipientUserId: input.recipientUserId,
      bookingId: input.bookingId,
      dedupeKey: input.dedupeKey,
      status: "QUEUED",
    },
    select: { id: true },
  });

  const result = await sendTemplatedEmail(input);

  await prisma.transactionalEmailLog.update({
    where: { id: log.id },
    data: {
      status: result.ok ? "SENT" : "FAILED",
      providerMessageId: result.providerMessageId,
      error: result.error,
    },
  });

  return result;
}

export function parseProviderWebhook(payload: unknown): ProviderWebhookEvent | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  const eventRaw = typeof body.event === "string" ? body.event.toUpperCase() : "";
  const messageId = typeof body.messageId === "string" ? body.messageId : undefined;

  if (eventRaw === "OPENED") return { messageId, event: "OPENED" };
  if (eventRaw === "CLICKED") return { messageId, event: "CLICKED" };
  return null;
}

type BookingEmailData = {
  to: string;
  bookingId: string;
  firstName: string;
  serviceName: string;
  startAt: Date;
};

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  const result = await sendTemplatedEmail({
    to: data.to,
    templateKey: "booking_confirmed",
    variables: {
      bookingId: data.bookingId,
      firstName: data.firstName,
      serviceName: data.serviceName,
      startAt: data.startAt,
    },
    metadata: { bookingId: data.bookingId, type: "booking_confirmation" },
  });


  if (!result.ok) {
    console.warn(JSON.stringify({ event: "booking_confirmation_email_failed", bookingId: data.bookingId, to: data.to, ...result }));
  }
}

export async function sendBookingReminderEmail(data: BookingEmailData & { scheduledHours: number; recipientUserId?: string }) {
  const result = await sendLoggedTransactionalEmail({
    to: data.to,
    templateKey: "booking_reminder",
    variables: {
      bookingId: data.bookingId,
      firstName: data.firstName,
      serviceName: data.serviceName,
      startAt: data.startAt,
    },
    metadata: {
      bookingId: data.bookingId,
      scheduledHours: String(data.scheduledHours),
      type: "booking_reminder",
    },
    recipientUserId: data.recipientUserId,
    bookingId: data.bookingId,
    dedupeKey: `reminder:${data.bookingId}:${data.scheduledHours}`,
  });

  if (!result.ok) {
    console.warn(
      JSON.stringify({
        event: "booking_reminder_email_failed",
        bookingId: data.bookingId,
        to: data.to,
        scheduledHours: data.scheduledHours,
        ...result,
      }),
    );
  }

  return result;
}
