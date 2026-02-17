import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/error-handler";
import { requireAuth } from "@/lib/middleware/auth";
import { clearAuthCookie } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";

export async function POST() {
  try {
    const user = await requireAuth();

    clearAuthCookie();

    logger.authEvent("logout", { userId: user.id, email: user.email });

    return NextResponse.json(createSuccessResponse({ message: "Logged out successfully" }));
  } catch {
    const handled = handleError();
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    return {
      code: "UNAUTHORIZED",
      message: "Failed to logout",
      statusCode: 401,
    };
  }
}
