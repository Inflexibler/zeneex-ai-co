export interface User {
  id: string;
  email: string;
  name: string;
  firebaseUid: string;
  role: "user" | "admin";
  subscriptionTier: "free" | "pro" | "enterprise";
  subscriptionStatus: "active" | "inactive" | "past_due" | "canceled";
  stripeCustomerId?: string;
  githubUsername?: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: "queued" | "processing" | "completed" | "failed";
  githubRepo?: string;
  deployedUrl?: string;
  errorMessage?: string;
  architecturePrompt?: string;
  codePrompt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Website {
  id: string;
  projectId: string;
  framework: string;
  pages: Page[];
  components: Component[];
  styles: Style[];
}

export interface Page {
  id: string;
  name: string;
  route: string;
  content: string;
}

export interface Component {
  id: string;
  name: string;
  code: string;
  props: Record<string, unknown>;
}

export interface Style {
  id: string;
  name: string;
  code: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: "free" | "pro" | "enterprise";
  status: "active" | "inactive" | "past_due" | "canceled";
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIGenerationStatus {
  id: string;
  projectId: string;
  stage: "architecture" | "engineering" | "deployment" | "completed" | "failed";
  progress: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptTemplate {
  id: string;
  name: string;
  type: "architecture" | "engineering";
  template: string;
  variables: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  prompt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  githubUsername?: string;
}

export interface GenerateWebsiteRequest {
  projectId: string;
  description: string;
  features?: string[];
  techStack?: string[];
}

export interface CreatePaymentRequest {
  planId: string;
}

export interface VerifyPaymentRequest {
  paymentIntentId: string;
}

export type PricingTier = "free" | "pro" | "enterprise";

export interface PricingPlan {
  id: string;
  name: PricingTier;
  price: number;
  interval: "month" | "year";
  features: string[];
  limits: {
    projects: number;
    aiGenerations: number;
    storage: string;
  };
  stripePriceId?: string;
}

export interface AIModelConfig {
  name: string;
  provider: "gemini" | "deepseek";
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface AdminConfig {
  adminEmails: string[];
  defaultUserRole: "user" | "admin";
}
