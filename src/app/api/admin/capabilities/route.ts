import { auth } from "@/lib/auth";
import { hasS3StorageConfig } from "@/lib/s3-storage";
import { NextResponse } from "next/server";

const ADMIN_ROLES = ["ADMIN", "OWNER", "STAFF"];

export async function GET() {
  const session = await auth();
  if (!session || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    journalImageUploadEnabled: hasS3StorageConfig(),
  });
}
