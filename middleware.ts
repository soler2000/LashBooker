import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_PREFIX = "/admin";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!role) return NextResponse.redirect(new URL("/login", req.url));
    if (!["STAFF", "ADMIN", "OWNER"].includes(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
