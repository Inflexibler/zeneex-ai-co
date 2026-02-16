import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  ValidationError,
  AuthenticationError,
} from "@/lib/utils/error-handler";
import { signInUser } from "@/lib/config/firebase";
import { createToken, setAuthCookie } from "@/lib/middleware/auth";
import { queryOne } from "@/lib/config/database";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, getClientIdentifier } from "@/lib/middleware/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const identifier = getClientIdentifier(request);
    checkRateLimit(identifier, "auth");

    const body = await request.json();

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.errors.map((e) => e.message).join(", ")
      );
    }

    const { email, password } = validation.data;

    logger.info("User login attempt", { email });

    const firebaseUser = await signInUser(email, password);

    const user = await queryOne(
      "SELECT * FROM users WHERE firebase_uid = $1",
      [firebaseUser.uid]
    );

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const token = await createToken({
      userId: user.id,
      firebaseUid: user.firebase_uid,
      email: user.email,
      role: user.role,
    });

    setAuthCookie(token);

    logger.authEvent("login", { userId: user.id, email });

    return NextResponse.json(
      createSuccessResponse({
        user,
        token,
      })
    );
  } catch (error) {
    const handled = handleError(error);
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    if (error instanceof ValidationError || error instanceof AuthenticationError) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    logger.error("Login error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      code: "INTERNAL_ERROR",
      message: "Failed to sign in",
      statusCode: 500,
    };
  }
}
