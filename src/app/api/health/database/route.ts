import { NextResponse } from "next/server";
import { ensureDatabaseAvailable, ensureDatabaseConfigured } from "@/lib/prisma";

export async function GET() {
  try {
    ensureDatabaseConfigured();
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        available: false,
        error: error instanceof Error ? error.message : "Database is not configured",
      },
      { status: 500 },
    );
  }

  try {
    await ensureDatabaseAvailable();

    return NextResponse.json({
      configured: true,
      available: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        available: false,
        error: error instanceof Error ? error.message : "Database check failed",
      },
      { status: 503 },
    );
  }
}
