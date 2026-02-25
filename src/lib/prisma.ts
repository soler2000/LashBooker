import { PrismaClient } from "@prisma/client";

const DATABASE_URL_ENV_KEYS = [
  "DATABASE_URL",
  "database_URL",
  "DATABASE_PUBLIC_URL",
  "DATABASE_PRIVATE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
] as const;

function resolveDatabaseUrl(): string | undefined {
  for (const key of DATABASE_URL_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }

  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
  if (!PGHOST || !PGPORT || !PGUSER || !PGPASSWORD || !PGDATABASE) {
    return undefined;
  }

  const username = encodeURIComponent(PGUSER);
  const password = encodeURIComponent(PGPASSWORD);
  return `postgresql://${username}:${password}@${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=require`;
}

const resolvedDatabaseUrl = resolveDatabaseUrl();
if (!process.env.DATABASE_URL && resolvedDatabaseUrl) {
  process.env.DATABASE_URL = resolvedDatabaseUrl;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function hasDatabaseConfiguration() {
  return Boolean(process.env.DATABASE_URL?.trim() || resolveDatabaseUrl());
}

type PrismaLikeError = {
  code?: string;
  meta?: {
    table?: string;
  };
};

export function isMissingDatabaseSchemaError(error: unknown) {
  const prismaError = error as PrismaLikeError;
  return prismaError?.code === "P2021" || prismaError?.code === "P2022";
}

export function getSchemaSetupHint(error: unknown) {
  if (!isMissingDatabaseSchemaError(error)) return undefined;

  const prismaError = error as PrismaLikeError;
  const missingResource = prismaError.meta?.table ? ` (${prismaError.meta.table})` : "";

  return `Database schema is missing${missingResource}. Run \`npx prisma db push\` and \`npm run prisma:seed\`.`;
}

export function ensureDatabaseConfigured() {
  if (!hasDatabaseConfiguration()) {
    throw new Error(
      "Database is not configured. Set DATABASE_URL (or database_URL / DATABASE_PUBLIC_URL / DATABASE_PRIVATE_URL / POSTGRES_URL / POSTGRES_URL_NON_POOLING) before starting the app.",
    );
  }
}

export async function ensureDatabaseAvailable() {
  ensureDatabaseConfigured();
  await prisma.$queryRaw`SELECT 1`;
}

type DatabaseWriteVerification = {
  tableExists: boolean;
  canRead: boolean;
  canInsert: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export async function verifyDatabaseWriteAccess(
  tableReference = 'public."User"',
): Promise<DatabaseWriteVerification> {
  const [result] = await prisma.$queryRaw<DatabaseWriteVerification[]>`
    SELECT
      to_regclass(${tableReference}) IS NOT NULL AS "tableExists",
      has_table_privilege(current_user, ${tableReference}, 'SELECT') AS "canRead",
      has_table_privilege(current_user, ${tableReference}, 'INSERT') AS "canInsert",
      has_table_privilege(current_user, ${tableReference}, 'UPDATE') AS "canUpdate",
      has_table_privilege(current_user, ${tableReference}, 'DELETE') AS "canDelete"
  `;

  return (
    result ?? {
      tableExists: false,
      canRead: false,
      canInsert: false,
      canUpdate: false,
      canDelete: false,
    }
  );
}

export async function ensureDatabaseTableWritable(tableReference = 'public."User"') {
  const verification = await verifyDatabaseWriteAccess(tableReference);
  if (!verification.tableExists) {
    throw new Error(`Database table ${tableReference} does not exist. Run Prisma migrations.`);
  }

  if (!verification.canRead || !verification.canInsert || !verification.canUpdate || !verification.canDelete) {
    throw new Error(
      `Database table ${tableReference} is not fully writable. Required privileges: SELECT, INSERT, UPDATE, DELETE.`,
    );
  }
}
