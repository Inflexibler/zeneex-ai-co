import { NextRequest, NextResponse } from "next/server";
import {
  createSuccessResponse,
  createErrorResponse,
  NotFoundError,
  AuthorizationError,
} from "@/lib/utils/error-handler";
import { requireAuth } from "@/lib/middleware/auth";
import { queryOne, query } from "@/lib/config/database";
import { logger } from "@/lib/utils/logger";
import { updateProjectSchema } from "@/lib/utils/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await requireAuth();
    const { projectId } = params;

    const project = await queryOne(
      "SELECT * FROM projects WHERE id = $1",
      [projectId]
    );

    if (!project) {
      throw new NotFoundError("Project");
    }

    if (project.user_id !== user.id && user.role !== "admin") {
      throw new AuthorizationError();
    }

    return NextResponse.json(createSuccessResponse(project));
  } catch (error) {
    const handled = handleError(error);
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    return {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch project",
      statusCode: 500,
    };
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await requireAuth();
    const { projectId } = params;

    const project = await queryOne(
      "SELECT * FROM projects WHERE id = $1",
      [projectId]
    );

    if (!project) {
      throw new NotFoundError("Project");
    }

    if (project.user_id !== user.id && user.role !== "admin") {
      throw new AuthorizationError();
    }

    const body = await request.json();

    const validation = updateProjectSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(
          "VALIDATION_ERROR",
          validation.error.errors.map((e) => e.message).join(", ")
        ),
        { status: 422 }
      );
    }

    const { name, description } = validation.data;

    if (name) {
      await query(
        "UPDATE projects SET name = $1, updated_at = NOW() WHERE id = $2",
        [name, projectId]
      );
    }

    if (description) {
      await query(
        "UPDATE projects SET description = $1, updated_at = NOW() WHERE id = $2",
        [description, projectId]
      );
    }

    const updatedProject = await queryOne(
      "SELECT * FROM projects WHERE id = $1",
      [projectId]
    );

    logger.info("Project updated", { projectId, userId: user.id });

    return NextResponse.json(createSuccessResponse(updatedProject));
  } catch (error) {
    const handled = handleError(error);
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    return {
      code: "INTERNAL_ERROR",
      message: "Failed to update project",
      statusCode: 500,
    };
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await requireAuth();
    const { projectId } = params;

    const project = await queryOne(
      "SELECT * FROM projects WHERE id = $1",
      [projectId]
    );

    if (!project) {
      throw new NotFoundError("Project");
    }

    if (project.user_id !== user.id && user.role !== "admin") {
      throw new AuthorizationError();
    }

    await query("DELETE FROM projects WHERE id = $1", [projectId]);

    logger.info("Project deleted", { projectId, userId: user.id });

    return NextResponse.json(createSuccessResponse({ message: "Project deleted successfully" }));
  } catch (error) {
    const handled = handleError(error);
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    return {
      code: "INTERNAL_ERROR",
      message: "Failed to delete project",
      statusCode: 500,
    };
  }
}
