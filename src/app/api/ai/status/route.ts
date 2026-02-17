import { NextRequest, NextResponse } from "next/server";
import {
  createSuccessResponse,
  createErrorResponse,
  NotFoundError,
} from "@/lib/utils/error-handler";
import { requireAuth } from "@/lib/middleware/auth";
import { queryOne } from "@/lib/config/database";

interface ProjectRow {
  id: string;
  name: string;
  description: string;
  status: string;
  github_repo: string | null;
  deployed_url: string | null;
  created_at: Date;
  updated_at: Date;
}

interface StatusRow {
  id: string;
  project_id: string;
  stage: string;
  progress: number;
  current_step: string | null;
  estimated_time_remaining: number | null;
  created_at: Date;
  updated_at: Date;
}

export async function GET(
  request: NextRequest
) {
  try {
    const user = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        createErrorResponse("VALIDATION_ERROR", "Project ID is required"),
        { status: 400 }
      );
    }

    const project = await queryOne<ProjectRow>(
      "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, user.id]
    );

    if (!project) {
      throw new NotFoundError("Project");
    }

    const status = await queryOne<StatusRow>(
      "SELECT * FROM ai_generation_status WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1",
      [projectId]
    );

    return NextResponse.json(
      createSuccessResponse({
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          githubRepo: project.github_repo,
          deployedUrl: project.deployed_url,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
        },
        generation: status
          ? {
              stage: status.stage,
              progress: status.progress,
              currentStep: status.current_step,
              estimatedTimeRemaining: status.estimated_time_remaining,
            }
          : null,
      })
    );
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
      message: "Failed to fetch generation status",
      statusCode: 401,
    };
  }
}
