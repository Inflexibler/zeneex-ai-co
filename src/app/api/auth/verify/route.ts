import { NextRequest, NextResponse } from "next/server";
import { verifyEmailSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  ValidationError,
  NotFoundError,
} from "@/lib/utils/error-handler";
import { verifyIdToken } from "@/lib/config/firebase";
import { query, queryOne } from "@/lib/config/database";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, getClientIdentifier } from "@/lib/middleware/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const identifier = getClientIdentifier(request);
    checkRateLimit(identifier, "auth");

    const body = await request.json();

    const validation = verifyEmailSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.errors.map((e) => e.message).join(", ")
      );
    }

    const { token } = validation.data;

    logger.info("Email verification attempt");

    const decoded = await verifyIdToken(token);

    const user = await queryOne(
      "SELECT * FROM users WHERE firebase_uid = $1",
      [decoded.uid]
    );

    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.emailVerified) {
      return NextResponse.json(createSuccessResponse({ message: "Email already verified" }));
    }

    await query(
      "UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1",
      [user.id]
    );

    logger.authEvent("email_verified", { userId: user.id, email: user.email });

    return NextResponse.json(createSuccessResponse({ message: "Email verified successfully" }));
  } catch (error) {
    const handled = handleError(error);
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    logger.error("Email verification error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      code: "INTERNAL_ERROR",
      message: "Failed to verify email",
      statusCode: 500,
    };
  }
}
