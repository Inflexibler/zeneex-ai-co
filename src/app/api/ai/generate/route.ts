import { NextRequest, NextResponse } from "next/server";
import { generateWebsiteSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  ValidationError,
  NotFoundError,
  SubscriptionError,
} from "@/lib/utils/error-handler";
import { requireAuth } from "@/lib/middleware/auth";
import { query, queryOne } from "@/lib/config/database";
import { architectAI } from "@/lib/ai/architect-ai";
import { engineerAI } from "@/lib/ai/engineer-ai";
import { Octokit } from "octokit";
import { logger } from "@/lib/utils/logger";
import { nanoid } from "nanoid";
import { checkRateLimit, getUserIdentifer } from "@/lib/middleware/rate-limit";
import { GITHUB_REPO_ORG, GITHUB_DEFAULT_BRANCH } from "@/lib/config/constants";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const identifier = getUserIdentifer(user.id);
    const rateLimitCheck = checkRateLimit(identifier, "aiGeneration");

    if (!rateLimitCheck.allowed) {
      throw new ValidationError("AI generation limit exceeded for this period");
    }

    const body = await request.json();

    const validation = generateWebsiteSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.errors.map((e) => e.message).join(", ")
      );
    }

    const { projectId, description } = validation.data;

    const project = await queryOne(
      "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, user.id]
    );

    if (!project) {
      throw new NotFoundError("Project");
    }

    if (!hasSubscription(user, "pro") && project.status !== "queued") {
      throw new SubscriptionError("Pro plan required for additional AI generations");
    }

    await query(
      "UPDATE projects SET status = 'processing', updated_at = NOW() WHERE id = $1",
      [projectId]
    );

    const generationId = nanoid();

    await query(
      `INSERT INTO ai_generation_status (id, project_id, stage, progress, current_step)
       VALUES ($1, $2, 'architecture', 0, 'Initializing generation')`,
      [generationId, projectId]
    );

    logger.info("Starting website generation", { projectId, userId: user.id });

    try {
      await query(
        "UPDATE ai_generation_status SET stage = 'architecture', progress = 10, current_step = 'Generating architecture' WHERE id = $1",
        [generationId]
      );

      const architectureResult = await architectAI.generateArchitecture(description);

      await query(
        `UPDATE projects 
         SET architecture_prompt = $1, updated_at = NOW() 
         WHERE id = $2`,
        [JSON.stringify(architectureResult), projectId]
      );

      await query(
        "UPDATE ai_generation_status SET stage = 'engineering', progress = 40, current_step = 'Generating code' WHERE id = $1",
        [generationId]
      );

      const codeResult = await engineerAI.generateCode(
        architectureResult.architecture,
        description
      );

      await query(
        `UPDATE projects 
         SET code_prompt = $1, updated_at = NOW() 
         WHERE id = $2`,
        [JSON.stringify(codeResult), projectId]
      );

      await query(
        "UPDATE ai_generation_status SET stage = 'deployment', progress = 70, current_step = 'Creating GitHub repository' WHERE id = $1",
        [generationId]
      );

      const githubPat = process.env.GITHUB_PAT;
      if (githubPat) {
        const octokit = new Octokit({ auth: githubPat });
        const repoName = `zenex-${project.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

        try {
          await octokit.rest.repos.createInOrg({
            org: GITHUB_REPO_ORG,
            name: repoName,
            description: project.description,
            private: true,
            auto_init: true,
          });

          for (const file of codeResult.files) {
            await octokit.rest.repos.createOrUpdateFileContents({
              owner: GITHUB_REPO_ORG,
              repo: repoName,
              path: file.name,
              message: `Add ${file.name}`,
              content: Buffer.from(file.content).toString("base64"),
              branch: GITHUB_DEFAULT_BRANCH,
            });
          }

          const githubRepo = `${GITHUB_REPO_ORG}/${repoName}`;

          await query(
            "UPDATE projects SET github_repo = $1, status = 'completed', updated_at = NOW() WHERE id = $2",
            [githubRepo, projectId]
          );

          await query(
            "UPDATE ai_generation_status SET stage = 'completed', progress = 100, current_step = 'Website generated successfully' WHERE id = $1",
            [generationId]
          );

          logger.info("Website generation completed", { projectId, githubRepo });

          return NextResponse.json(
            createSuccessResponse({
              projectId,
              githubRepo,
              architecture: architectureResult,
              files: codeResult.files,
              status: "completed",
            })
          );
        } catch (githubError) {
          logger.error("GitHub integration failed", {
            error: githubError instanceof Error ? githubError.message : "Unknown error",
          });

          await query(
            "UPDATE projects SET status = 'completed', updated_at = NOW() WHERE id = $1",
            [projectId]
          );

          await query(
            "UPDATE ai_generation_status SET stage = 'completed', progress = 100, current_step = 'Website generated (GitHub deployment skipped)' WHERE id = $1",
            [generationId]
          );

          return NextResponse.json(
            createSuccessResponse({
              projectId,
              architecture: architectureResult,
              files: codeResult.files,
              status: "completed",
              warning: "GitHub deployment was skipped",
            })
          );
        }
      } else {
        await query(
          "UPDATE projects SET status = 'completed', updated_at = NOW() WHERE id = $1",
          [projectId]
        );

        await query(
          "UPDATE ai_generation_status SET stage = 'completed', progress = 100, current_step = 'Website generated successfully' WHERE id = $1",
          [generationId]
        );

        return NextResponse.json(
          createSuccessResponse({
            projectId,
            architecture: architectureResult,
            files: codeResult.files,
            status: "completed",
          })
        );
      }
    } catch (error) {
      await query(
        `UPDATE projects 
         SET status = 'failed', error_message = $1, updated_at = NOW() 
         WHERE id = $2`,
        [error instanceof Error ? error.message : "Generation failed", projectId]
      );

      await query(
        "UPDATE ai_generation_status SET stage = 'failed', progress = 0, current_step = $1 WHERE id = $2",
        [error instanceof Error ? error.message : "Generation failed", generationId]
      );

      throw error;
    }
  } catch (error) {
    const handled = handleError(error);
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof SubscriptionError) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    logger.error("Website generation error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      code: "AI_SERVICE_ERROR",
      message: "Failed to generate website",
      statusCode: 500,
    };
  }
}
