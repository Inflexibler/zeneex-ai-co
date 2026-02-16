import { NextRequest, NextResponse } from "next/server";
import { signupSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  ValidationError,
  ConflictError,
} from "@/lib/utils/error-handler";
import { createUser } from "@/lib/config/firebase";
import { createToken, setAuthCookie } from "@/lib/middleware/auth";
import { query } from "@/lib/config/database";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, getClientIdentifier } from "@/lib/middleware/rate-limit";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const identifier = getClientIdentifier(request);
    checkRateLimit(identifier, "auth");

    const body = await request.json();

    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.errors.map((e) => e.message).join(", ")
      );
    }

    const { email, password, name } = validation.data;

    logger.info("User signup attempt", { email });

    const existingUser = await query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.length > 0) {
      throw new ConflictError("User with this email already exists");
    }

    const firebaseResult = await createUser(email, password, name);

    const userId = nanoid();

    await query(
      `INSERT INTO users (id, email, name, firebase_uid, role, subscription_tier, subscription_status, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        email,
        name,
        firebaseResult.firebaseUid,
        "user",
        "free",
        "inactive",
        false,
      ]
    );

    await query(
      `INSERT INTO subscriptions (user_id, tier, status, current_period_start, current_period_end)
       VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '30 days')`,
      [userId, "free", "active"]
    );

    const user = await query(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );

    const token = await createToken({
      userId: user[0].id,
      firebaseUid: user[0].firebase_uid,
      email: user[0].email,
      role: user[0].role,
    });

    setAuthCookie(token);

    logger.authEvent("signup", { userId, email });

    return NextResponse.json(
      createSuccessResponse({
        user: user[0],
        token,
      }),
      { status: 201 }
    );
  } catch (error) {
    const handled = handleError(error);
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    if (error instanceof ValidationError || error instanceof ConflictError) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    logger.error("Signup error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      code: "INTERNAL_ERROR",
      message: "Failed to create account",
      statusCode: 500,
    };
  }
}
