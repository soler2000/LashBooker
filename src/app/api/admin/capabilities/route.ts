import { auth } from "@/lib/auth";
import { getJournalImageStorageBackend, isJournalImageUploadEnabled } from "@/lib/journal-image-storage";
import { NextResponse } from "next/server";

const ADMIN_ROLES = ["ADMIN", "OWNER", "STAFF"];

export async function GET() {
  const session = await auth();
  if (!session || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    journalImageUploadEnabled: isJournalImageUploadEnabled(),
    journalImageStorageBackend: getJournalImageStorageBackend(),
  });
}
