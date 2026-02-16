import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";
import { PROTECTED_ROUTES, ADMIN_ROUTES } from "@/lib/config/constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  logger.info("Middleware request", { pathname });

  try {
    const token = request.cookies.get("auth_token")?.value;

    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

    if (isProtectedRoute || isAdminRoute) {
      if (!token) {
        logger.info("Redirecting to login - no token", { pathname });
        const url = new URL("/login", request.url);
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }

      try {
        const payload = await verifyToken(token);

        if (isAdminRoute && payload.role !== "admin") {
          logger.warn("Admin access denied", { userId: payload.userId, pathname });
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        const response = NextResponse.next();

        response.headers.set("x-user-id", payload.userId);
        response.headers.set("x-user-email", payload.email);

        return response;
      } catch (error) {
        logger.warn("Invalid token - redirecting to login", { pathname });
        const url = new URL("/login", request.url);
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }
    }

    if ((pathname === "/login" || pathname === "/signup") && token) {
      try {
        await verifyToken(token);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch (error) {
        return NextResponse.next();
      }
    }

    const response = NextResponse.next();

    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
    );

    return response;
  } catch (error) {
    logger.error("Middleware error", {
      error: error instanceof Error ? error.message : "Unknown error",
      pathname,
    });

    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
