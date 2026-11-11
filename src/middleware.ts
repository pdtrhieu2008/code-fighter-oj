import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const userRole = (session?.user as any)?.role;

  const adminRoutes = ["/admin"];
  const protectedRoutes = ["/dashboard", "/profile/settings", "/submissions"];
  const authRoutes = ["/login", "/register"];

  // 1. Admin route protection
  if (adminRoutes.some((route) => nextUrl.pathname.startsWith(route))) {
    if (!isLoggedIn || !["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      const loginUrl = new URL("/login", nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Member route protection
  if (protectedRoutes.some((route) => nextUrl.pathname.startsWith(route))) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Guest-only routes
  if (authRoutes.includes(nextUrl.pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
