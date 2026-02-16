import OpenAI from "openai";
import { AIModelConfig } from "../types";
import { logger } from "../utils/logger";
import { AIServiceError } from "../utils/error-handler";
import { keyRotation } from "./key-rotation";
import { PROMPT_TEMPLATES } from "../config/constants";

const DEEPSEEK_KEYS = [
  process.env.DEEPSEEK_API_KEY,
  process.env.DEEPSEEK_API_KEY_2,
].filter((key): key is string => !!key);

class EngineerAI {
  private client: OpenAI | null = null;
  private config: AIModelConfig;

  constructor() {
    this.config = {
      name: "engineer",
      provider: "deepseek",
      model: "deepseek-r1",
      maxTokens: 16384,
      temperature: 0.3,
    };
  }

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = keyRotation.getKey("deepseek", DEEPSEEK_KEYS);

      this.client = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://api.deepseek.com/v1",
        dangerouslyAllowBrowser: false,
      });
    }
    return this.client;
  }

  async generateCode(
    architecture: string,
    prompt: string
  ): Promise<{
    files: Array<{ name: string; content: string }>;
    success: boolean;
  }> {
    const startTime = Date.now();
    const client = this.getClient();

    try {
      logger.aiRequest("deepseek", this.config.model, {
        type: "code_generation",
        promptLength: prompt.length,
        architectureLength: architecture.length,
      });

      const formattedPrompt = PROMPT_TEMPLATES.engineering
        .replace("{architecture}", architecture)
        .replace("{prompt}", prompt);

      const completion = await client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert full-stack engineer specializing in Next.js, React, TypeScript, and Tailwind CSS. Generate production-ready, clean, and maintainable code.",
          },
          {
            role: "user",
            content: formattedPrompt,
          },
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const text = completion.choices[0]?.message?.content || "";

      const duration = Date.now() - startTime;
      const tokens = completion.usage?.total_tokens || 0;

      logger.aiResponse("deepseek", this.config.model, duration, tokens);

      keyRotation.recordSuccess("deepseek");

      const files = this.parseCodeResponse(text);

      return {
        files,
        success: true,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Code generation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
      });

      keyRotation.recordFailure("deepseek");

      if (error instanceof Error) {
        throw new AIServiceError(`Code generation failed: ${error.message}`);
      }

      throw new AIServiceError("Code generation failed");
    }
  }

  private parseCodeResponse(text: string): Array<{ name: string; content: string }> {
    const files: Array<{ name: string; content: string }> = [];

    const codeBlockRegex = /```(\w+)?\s*[\n\r]([\s\S]*?)```/g;
    const matches = text.matchAll(codeBlockRegex);

    for (const match of matches) {
      const language = match[1] || "tsx";
      const content = match[2].trim();

      if (language === "tsx" || language === "ts" || language === "jsx" || language === "js") {
        const fileName = this.suggestFileName(content, language);
        files.push({
          name: fileName,
          content,
        });
      }
    }

    if (files.length === 0) {
      const fileName = this.suggestFileName(text, "tsx");
      files.push({
        name: fileName,
        content: text.trim(),
      });
    }

    return files;
  }

  private suggestFileName(content: string, language: string): string {
    const componentMatch = content.match(/(?:export\s+(?:default\s+)?)?(?:const|function|class)\s+(\w+)/);
    const componentName = componentMatch ? componentMatch[1].toLowerCase() : "component";

    const extension = language === "ts" || language === "tsx" ? "tsx" : "jsx";

    const possibleNames = [
      `${componentName}.${extension}`,
      `page.${extension}`,
      `layout.${extension}`,
      `index.${extension}`,
    ];

    return possibleNames[0];
  }

  async optimizeCode(code: string): Promise<{
    optimized: string;
    improvements: string[];
  }> {
    const client = this.getClient();

    try {
      const prompt = `
        Review and optimize the following code for better performance, readability, and best practices:

        ${code}

        Provide:
        1. Optimized code
        2. List of improvements made

        Format as:
        \`\`\`tsx
        // optimized code here
        \`\`\`

        Improvements:
        - improvement 1
        - improvement 2
      `;

      const completion = await client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: "You are a code optimization expert. Improve code for performance, readability, and best practices.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 4096,
        temperature: 0.2,
      });

      const text = completion.choices[0]?.message?.content || "";

      const codeMatch = text.match(/```(?:tsx?|jsx?)\s*([\s\S]*?)```/);
      const optimizedCode = codeMatch ? codeMatch[1] : code;

      const improvementsMatch = text.match(/Improvements:\s*([\s\S]*?)(?=\n\n|$)/);
      const improvementsText = improvementsMatch ? improvementsMatch[1] : "";
      const improvements = improvementsText
        .split("\n")
        .map((line) => line.replace(/^[-*]\s*/, "").trim())
        .filter((line) => line.length > 0);

      return {
        optimized: optimizedCode.trim(),
        improvements,
      };
    } catch (error) {
      logger.error("Code optimization failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        optimized: code,
        improvements: [],
      };
    }
  }

  async generateTests(code: string): Promise<string> {
    const client = this.getClient();

    try {
      const prompt = `
        Generate comprehensive unit tests for the following code using Jest and React Testing Library:

        ${code}

        Provide only the test code without explanations.
      `;

      const completion = await client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: "You are a test generation expert. Create comprehensive, well-structured unit tests.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 4096,
        temperature: 0.3,
      });

      const text = completion.choices[0]?.message?.content || "";

      const codeMatch = text.match(/```(?:tsx?|jsx?)\s*([\s\S]*?)```/);
      return codeMatch ? codeMatch[1].trim() : text.trim();
    } catch (error) {
      logger.error("Test generation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return "";
    }
  }

  resetClient(): void {
    this.client = null;
  }
}

export const engineerAI = new EngineerAI();
