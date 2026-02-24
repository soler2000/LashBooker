import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_PREFIX = "/admin";
const CHANGE_PASSWORD_PATH = "/admin/change-password";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;
  const mustChangePassword = req.auth?.user?.mustChangePassword;

  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!role) return NextResponse.redirect(new URL("/login", req.url));
    if (!["STAFF", "ADMIN", "OWNER"].includes(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (mustChangePassword && pathname !== CHANGE_PASSWORD_PATH) {
      return NextResponse.redirect(new URL(CHANGE_PASSWORD_PATH, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
