import { auth } from "@/lib/auth";
import { getSegmentRecipients, parseSegmentType } from "@/lib/marketing";
import { NextResponse } from "next/server";

const ADMIN_ROLES = ["ADMIN", "OWNER", "STAFF"];

export async function GET(_: Request, { params }: { params: { type: string } }) {
  const session = await auth();
  if (!session || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type } = params;
  const segmentType = parseSegmentType(type);

  if (!segmentType) {
    return NextResponse.json({ error: "Unsupported segment type" }, { status: 400 });
  }

  const recipients = await getSegmentRecipients(segmentType);
  return NextResponse.json({ type: segmentType, count: recipients.length, recipients });
}
