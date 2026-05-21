import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const isAuth = !!token;

    // Define who gets access to the admin dashboard
    const hasAdminAccess =
      token?.role === "ADMINISTRATOR" || token?.role === "SUPPORT";
    const isAuthPage = pathname.startsWith("/login");

    // 1. If they are on the login page
    if (isAuthPage) {
      if (isAuth && hasAdminAccess) {
        // Already logged in securely? Go straight to dashboard
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      // Otherwise, let them see the login page so they can sign in
      return NextResponse.next();
    }

    // 2. If they are NOT logged in and trying to access a protected route
    if (!isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) from += req.nextUrl.search;

      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.url),
      );
    }

    // 3. If they ARE logged in, but lack Admin/Support privileges
    if (!hasAdminAccess) {
      return NextResponse.redirect(
        new URL("/login?error=AccessDenied", req.url),
      );
    }

    // 4. Authorized and logged in -> Proceed
    return NextResponse.next();
  },
  {
    callbacks: {
      // 🚨 CRITICAL FIX: Return true to bypass NextAuth's buggy internal redirect loop.
      // This forces NextAuth to let the custom middleware function above handle ALL routing.
      authorized: () => true,
    },
  },
);

export const config = {
  // EXCLUDE /login, /api, and static files from the matcher
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons|public|sounds|sw.js|manifest.json|$).*)",
  ],
};
