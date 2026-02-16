import { NextRequest, NextResponse } from "next/server";
import { adminGetUsersSchema, adminUpdateUserSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from "@/lib/utils/error-handler";
import { requireAdmin } from "@/lib/middleware/auth";
import { query, queryOne } from "@/lib/config/database";
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;

    const validation = adminGetUsersSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
      role: searchParams.get("role"),
      status: searchParams.get("status"),
    });

    if (!validation.success) {
      throw new ValidationError(
        validation.error.errors.map((e) => e.message).join(", ")
      );
    }

    const { page, limit, search, role, status } = validation.data;

    const offset = (page - 1) * limit;

    let whereClause = "";
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` WHERE (email ILIKE $${paramIndex} OR name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereClause += whereClause
        ? ` AND role = $${paramIndex}`
        : ` WHERE role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (status) {
      whereClause += whereClause
        ? ` AND subscription_status = $${paramIndex}`
        : ` WHERE subscription_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const users = await query(
      `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${
        paramIndex + 1
      }`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      params
    );

    const total = parseInt(countResult[0]?.count || "0", 10);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      createSuccessResponse({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      })
    );
  } catch (error) {
    const handled = handleError(error);
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof AuthorizationError
    ) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    logger.error("Admin users fetch error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch users",
      statusCode: 500,
    };
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminUser = await requireAdmin();

    const body = await request.json();

    const validation = adminUpdateUserSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.errors.map((e) => e.message).join(", ")
      );
    }

    const { userId, role, subscriptionStatus } = validation.data;

    const user = await queryOne("SELECT * FROM users WHERE id = $1", [userId]);

    if (!user) {
      throw new NotFoundError("User");
    }

    if (role && user.role !== role) {
      await query(
        "UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2",
        [role, userId]
      );
      logger.info("Admin updated user role", {
        adminId: adminUser.id,
        userId,
        newRole: role,
      });
    }

    if (subscriptionStatus && user.subscription_status !== subscriptionStatus) {
      await query(
        "UPDATE users SET subscription_status = $1, updated_at = NOW() WHERE id = $2",
        [subscriptionStatus, userId]
      );

      await query(
        "UPDATE subscriptions SET status = $1 WHERE user_id = $2",
        [subscriptionStatus, userId]
      );

      logger.info("Admin updated user subscription status", {
        adminId: adminUser.id,
        userId,
        newStatus: subscriptionStatus,
      });
    }

    const updatedUser = await queryOne("SELECT * FROM users WHERE id = $1", [userId]);

    return NextResponse.json(createSuccessResponse(updatedUser));
  } catch (error) {
    const handled = handleError(error);
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof AuthorizationError
    ) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    logger.error("Admin user update error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      code: "INTERNAL_ERROR",
      message: "Failed to update user",
      statusCode: 500,
    };
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminUser = await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      throw new ValidationError("User ID is required");
    }

    const user = await queryOne("SELECT * FROM users WHERE id = $1", [userId]);

    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.id === adminUser.id) {
      throw new ValidationError("Cannot delete your own account");
    }

    await query("DELETE FROM users WHERE id = $1", [userId]);

    logger.info("Admin deleted user", {
      adminId: adminUser.id,
      userId,
      deletedEmail: user.email,
    });

    return NextResponse.json(createSuccessResponse({ message: "User deleted successfully" }));
  } catch (error) {
    const handled = handleError(error);
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof AuthorizationError
    ) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    logger.error("Admin user deletion error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      code: "INTERNAL_ERROR",
      message: "Failed to delete user",
      statusCode: 500,
    };
  }
}
