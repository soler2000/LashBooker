import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

type ConnectionInput = {
  connectionString?: string;
  host?: string;
  port?: string;
  database?: string;
  user?: string;
  password?: string;
  sslMode?: "disable" | "prefer" | "require";
};

function toNonEmptyString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildConnectionString(input: ConnectionInput) {
  const directConnectionString = toNonEmptyString(input.connectionString);
  if (directConnectionString) {
    return directConnectionString;
  }

  const host = toNonEmptyString(input.host);
  const port = toNonEmptyString(input.port);
  const database = toNonEmptyString(input.database);
  const user = toNonEmptyString(input.user);
  const password = toNonEmptyString(input.password);

  if (!host || !port || !database || !user || !password) {
    return undefined;
  }

  const sslMode = input.sslMode ?? "require";
  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);

  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${database}?sslmode=${sslMode}`;
}

function maskConnectionString(connectionString: string) {
  try {
    const parsed = new URL(connectionString);
    if (parsed.password) {
      parsed.password = "********";
    }

    return parsed.toString();
  } catch {
    return connectionString.replace(/:(.*?)@/, ":********@");
  }
}

function extractErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Unknown connection error.";
  }

  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Unknown connection error.";
}

export async function POST(request: Request) {
  let body: ConnectionInput;

  try {
    body = (await request.json()) as ConnectionInput;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON payload.",
      },
      { status: 400 },
    );
  }

  const connectionString = buildConnectionString(body);

  if (!connectionString) {
    return NextResponse.json(
      {
        success: false,
        error: "Provide either a full connection string or host/port/database/user/password fields.",
      },
      { status: 400 },
    );
  }

  const client = new PrismaClient({ datasourceUrl: connectionString });
  const startedAt = Date.now();

  try {
    await client.$queryRaw`SELECT 1`;
    const elapsedMs = Date.now() - startedAt;

    return NextResponse.json({
      success: true,
      elapsedMs,
      usedConnectionString: maskConnectionString(connectionString),
      message: "Connection successful.",
    });
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;

    return NextResponse.json(
      {
        success: false,
        elapsedMs,
        usedConnectionString: maskConnectionString(connectionString),
        error: extractErrorMessage(error),
      },
      { status: 503 },
    );
  } finally {
    await client.$disconnect();
  }
}
