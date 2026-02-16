import { NextRequest, NextResponse } from "next/server";
import { updateProfileSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  ValidationError,
  NotFoundError,
} from "@/lib/utils/error-handler";
import { requireAuth } from "@/lib/middleware/auth";
import { queryOne, query } from "@/lib/config/database";
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const userProfile = await queryOne(
      `SELECT u.*, s.tier as subscription_tier, s.status as subscription_status, 
              s.current_period_end, s.cancel_at_period_end
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
       WHERE u.id = $1`,
      [user.id]
    );

    if (!userProfile) {
      throw new NotFoundError("User");
    }

    return NextResponse.json(createSuccessResponse(userProfile));
  } catch (error) {
    const handled = handleError(error);
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    if (error instanceof NotFoundError) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    return {
      code: "UNAUTHORIZED",
      message: "Failed to fetch profile",
      statusCode: 401,
    };
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();

    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.errors.map((e) => e.message).join(", ")
      );
    }

    const { name, githubUsername } = validation.data;

    if (name) {
      await query(
        "UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2",
        [name, user.id]
      );
    }

    if (githubUsername) {
      await query(
        "UPDATE users SET github_username = $1, updated_at = NOW() WHERE id = $2",
        [githubUsername, user.id]
      );
    }

    const updatedUser = await queryOne(
      "SELECT * FROM users WHERE id = $1",
      [user.id]
    );

    logger.info("Profile updated", { userId: user.id });

    return NextResponse.json(createSuccessResponse(updatedUser));
  } catch (error) {
    const handled = handleError(error);
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    if (error instanceof ValidationError) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    return {
      code: "UNAUTHORIZED",
      message: "Failed to update profile",
      statusCode: 401,
    };
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();

    await query("DELETE FROM users WHERE id = $1", [user.id]);

    logger.info("User account deleted", { userId: user.id, email: user.email });

    return NextResponse.json(createSuccessResponse({ message: "Account deleted successfully" }));
  } catch (error) {
    const handled = handleError(error);
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    return {
      code: "UNAUTHORIZED",
      message: "Failed to delete account",
      statusCode: 401,
    };
  }
}
