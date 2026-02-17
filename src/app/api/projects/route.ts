import { NextRequest, NextResponse } from "next/server";
import {
  createSuccessResponse,
  createErrorResponse,
  ValidationError,
  SubscriptionError,
} from "@/lib/utils/error-handler";
import { requireAuth } from "@/lib/middleware/auth";
import { query, queryOne } from "@/lib/config/database";
import { logger } from "@/lib/utils/logger";
import { createProjectSchema } from "@/lib/utils/validation";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const user = await requireAuth();

    const projects = await query(
      `SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC`,
      [user.id]
    );

    return NextResponse.json(createSuccessResponse(projects));
  } catch {
    return NextResponse.json(
      createErrorResponse("UNAUTHORIZED", "Failed to fetch projects"),
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();

    const validation = createProjectSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.errors.map((e) => e.message).join(", ")
      );
    }

    const { name, description, prompt } = validation.data;

    const existingProjects = await query(
      "SELECT COUNT(*) as count FROM projects WHERE user_id = $1",
      [user.id]
    );

    const projectCount = parseInt(existingProjects[0]?.count || "0", 10);
    const maxProjects = user.subscriptionTier === "pro" ? 10 : 1;

    if (projectCount >= maxProjects) {
      throw new SubscriptionError(
        `You've reached your project limit. Upgrade to Pro for ${maxProjects === 1 ? "10" : "unlimited"} projects.`
      );
    }

    const projectId = nanoid();

    await query(
      `INSERT INTO projects (id, user_id, name, description, architecture_prompt, status)
       VALUES ($1, $2, $3, $4, $5, 'queued')`,
      [projectId, user.id, name, description, prompt]
    );

    const project = await queryOne(
      "SELECT * FROM projects WHERE id = $1",
      [projectId]
    );

    logger.info("Project created", { projectId, userId: user.id });

    return NextResponse.json(createSuccessResponse(project), { status: 201 });
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handled = handleError(error);
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    if (error instanceof ValidationError || error instanceof SubscriptionError) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    logger.error("Project creation error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      code: "INTERNAL_ERROR",
      message: "Failed to create project",
      statusCode: 500,
    };
  }
}
