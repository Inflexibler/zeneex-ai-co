import { PricingPlan, AIModelConfig } from "../types";

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "free",
    price: 0,
    interval: "month",
    features: [
      "1 website project",
      "5 AI generations per month",
      "Basic templates",
      "Community support",
    ],
    limits: {
      projects: 1,
      aiGenerations: 5,
      storage: "100MB",
    },
  },
  {
    id: "pro",
    name: "pro",
    price: 29,
    interval: "month",
    features: [
      "10 website projects",
      "100 AI generations per month",
      "Premium templates",
      "Priority support",
      "Custom domains",
      "Advanced analytics",
    ],
    limits: {
      projects: 10,
      aiGenerations: 100,
      storage: "10GB",
    },
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  {
    id: "enterprise",
    name: "enterprise",
    price: 99,
    interval: "month",
    features: [
      "Unlimited website projects",
      "Unlimited AI generations",
      "White-label solution",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "Team collaboration",
    ],
    limits: {
      projects: -1,
      aiGenerations: -1,
      storage: "unlimited",
    },
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  },
];

export const AI_MODELS: Record<string, AIModelConfig> = {
  architect: {
    name: "architect",
    provider: "gemini",
    model: "gemini-1.5-flash",
    maxTokens: 8192,
    temperature: 0.7,
  },
  engineer: {
    name: "engineer",
    provider: "deepseek",
    model: "deepseek-r1",
    maxTokens: 16384,
    temperature: 0.3,
  },
};

export const RATE_LIMITS = {
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  },
  api: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },
  aiGeneration: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
  admin: {
    windowMs: 60 * 1000,
    maxRequests: 200,
  },
};

export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  DATABASE_ERROR: "DATABASE_ERROR",
  AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
  PAYMENT_ERROR: "PAYMENT_ERROR",
  SUBSCRIPTION_ERROR: "SUBSCRIPTION_ERROR",
  GITHUB_ERROR: "GITHUB_ERROR",
};

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.UNAUTHORIZED]: "You are not authorized to access this resource",
  [ERROR_CODES.FORBIDDEN]: "You do not have permission to perform this action",
  [ERROR_CODES.NOT_FOUND]: "The requested resource was not found",
  [ERROR_CODES.VALIDATION_ERROR]: "Invalid input data provided",
  [ERROR_CODES.CONFLICT]: "Resource already exists",
  [ERROR_CODES.INTERNAL_ERROR]: "An unexpected error occurred",
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: "Rate limit exceeded, please try again later",
  [ERROR_CODES.DATABASE_ERROR]: "Database operation failed",
  [ERROR_CODES.AI_SERVICE_ERROR]: "AI service is unavailable",
  [ERROR_CODES.PAYMENT_ERROR]: "Payment processing failed",
  [ERROR_CODES.SUBSCRIPTION_ERROR]: "Subscription error occurred",
  [ERROR_CODES.GITHUB_ERROR]: "GitHub integration error",
};

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const JWT_CONFIG = {
  expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  algorithm: "HS256",
};

export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
} as const;

export const PROJECT_STATUS = {
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const SUBSCRIPTION_TIERS = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
} as const;

export const AI_GENERATION_STAGES = {
  ARCHITECTURE: "architecture",
  ENGINEERING: "engineering",
  DEPLOYMENT: "deployment",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/billing",
  "/settings",
  "/editor",
  "/admin",
];

export const ADMIN_ROUTES = ["/admin"];

export const GITHUB_REPO_ORG = process.env.GITHUB_REPO_ORG || "zenex-ai-sites";

export const GITHUB_DEFAULT_BRANCH = "main";

export const DATABASE_TABLES = {
  USERS: "users",
  PROJECTS: "projects",
  WEBSITES: "websites",
  SUBSCRIPTIONS: "subscriptions",
  PAYMENTS: "payments",
  AI_GENERATION_STATUS: "ai_generation_status",
} as const;

export const PROMPT_TEMPLATES = {
  architecture: `You are an expert software architect. Design a modern, scalable website architecture for the following requirements:

{prompt}

Please provide:
1. Technology stack recommendations
2. Project structure
3. Component architecture
4. Database schema (if needed)
5. API endpoints (if needed)
6. Deployment strategy

Format your response as JSON with clear sections.`,

  engineering: `You are an expert frontend engineer. Generate production-ready code for the following architecture and requirements:

Architecture: {architecture}
Requirements: {prompt}

Please provide:
1. Complete component code
2. Styling (CSS/Tailwind)
3. Any necessary utilities
4. Comments for complex logic

Format your response as valid code blocks.`,
};
