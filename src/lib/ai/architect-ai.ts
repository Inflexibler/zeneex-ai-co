import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { AIModelConfig } from "../types";
import { logger } from "../utils/logger";
import { AIServiceError } from "../utils/error-handler";
import { keyRotation } from "./key-rotation";
import { PROMPT_TEMPLATES } from "../config/constants";

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter((key): key is string => !!key);

class ArchitectAI {
  private model: GenerativeModel | null = null;
  private config: AIModelConfig;

  constructor() {
    this.config = {
      name: "architect",
      provider: "gemini",
      model: "gemini-1.5-flash",
      maxTokens: 8192,
      temperature: 0.7,
    };
  }

  private getModel(): GenerativeModel {
    if (!this.model) {
      const apiKey = keyRotation.getKey("gemini", GEMINI_KEYS);
      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          maxOutputTokens: this.config.maxTokens,
          temperature: this.config.temperature,
        },
      });
    }
    return this.model;
  }

  async generateArchitecture(prompt: string): Promise<{
    architecture: string;
    techStack: string[];
    components: string[];
    success: boolean;
  }> {
    const startTime = Date.now();
    const model = this.getModel();

    try {
      logger.aiRequest("gemini", this.config.model, {
        type: "architecture",
        promptLength: prompt.length,
      });

      const formattedPrompt = PROMPT_TEMPLATES.architecture.replace(
        "{prompt}",
        prompt
      );

      const result = await model.generateContent(formattedPrompt);
      const response = await result.response;
      const text = response.text();

      const duration = Date.now() - startTime;
      logger.aiResponse("gemini", this.config.model, duration, text.length);

      keyRotation.recordSuccess("gemini");

      const parsed = this.parseArchitectureResponse(text);

      return {
        ...parsed,
        success: true,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Architecture generation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
      });

      keyRotation.recordFailure("gemini");

      if (error instanceof Error) {
        throw new AIServiceError(`Architecture generation failed: ${error.message}`);
      }

      throw new AIServiceError("Architecture generation failed");
    }
  }

  private parseArchitectureResponse(text: string): {
    architecture: string;
    techStack: string[];
    components: string[];
  } {
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;

      const parsed = JSON.parse(jsonString);

      return {
        architecture: parsed.architecture || parsed.description || text,
        techStack: parsed.techStack || parsed.technologies || [],
        components: parsed.components || [],
      };
    } catch (error) {
      logger.warn("Failed to parse architecture JSON, using raw text", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        architecture: text,
        techStack: this.extractTechStack(text),
        components: this.extractComponents(text),
      };
    }
  }

  private extractTechStack(text: string): string[] {
    const keywords = [
      "React",
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Node.js",
      "PostgreSQL",
      "Firebase",
      "GraphQL",
      "REST API",
    ];

    const found: string[] = [];
    for (const keyword of keywords) {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        found.push(keyword);
      }
    }

    return found.length > 0 ? found : ["React", "Next.js", "TypeScript", "Tailwind CSS"];
  }

  private extractComponents(text: string): string[] {
    const patterns = [
      /(?:component|feature):\s*["']?([\w\s]+)["']?/gi,
      /create\s+(\w+(?:\s+\w+)?\s+component)/gi,
    ];

    const components: Set<string> = new Set();

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          components.add(match[1].trim());
        }
      }
    }

    return Array.from(components);
  }

  async validateArchitecture(architecture: string): Promise<{
    valid: boolean;
    suggestions: string[];
  }> {
    const model = this.getModel();

    try {
      const validationPrompt = `
        Review the following website architecture and provide feedback on its validity and suggest improvements:

        ${architecture}

        Respond with a JSON object containing:
        {
          "valid": true/false,
          "suggestions": ["suggestion1", "suggestion2", ...]
        }
      `;

      const result = await model.generateContent(validationPrompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;

      const parsed = JSON.parse(jsonString);

      return {
        valid: parsed.valid || true,
        suggestions: parsed.suggestions || [],
      };
    } catch (error) {
      logger.error("Architecture validation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        valid: true,
        suggestions: [],
      };
    }
  }

  resetModel(): void {
    this.model = null;
  }
}

export const architectAI = new ArchitectAI();
