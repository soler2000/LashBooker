import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function ensureDatabaseConfigured() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not configured. Set it in your environment before starting the app.");
  }
}

export async function ensureDatabaseAvailable() {
  ensureDatabaseConfigured();
  await prisma.$queryRaw`SELECT 1`;
}
