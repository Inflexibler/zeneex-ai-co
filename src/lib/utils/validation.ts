import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
    .optional(),
  githubUsername: z
    .string()
    .min(1, "GitHub username is required")
    .max(39, "GitHub username must be less than 39 characters")
    .regex(/^[a-zA-Z0-9-]+$/, "Invalid GitHub username format")
    .optional(),
});

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters")
    .trim(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters")
    .trim(),
  prompt: z
    .string()
    .min(20, "Prompt must be at least 20 characters")
    .max(5000, "Prompt must be less than 5000 characters")
    .trim(),
});

export const generateWebsiteSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be less than 2000 characters"),
  features: z
    .array(z.string().min(1).max(100))
    .max(20, "Maximum 20 features allowed")
    .optional(),
  techStack: z
    .array(z.string().min(1).max(50))
    .max(10, "Maximum 10 technologies allowed")
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters")
    .trim()
    .optional(),
});

export const createPaymentSchema = z.object({
  planId: z.enum(["free", "pro", "enterprise"], {
    errorMap: () => ({ message: "Invalid plan ID" }),
  }),
});

export const verifyPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment intent ID is required"),
});

export const updateSettingsSchema = z.object({
  notifications: z
    .object({
      email: z.boolean().optional(),
      marketing: z.boolean().optional(),
    })
    .optional(),
  preferences: z
    .object({
      theme: z.enum(["light", "dark", "system"]).optional(),
      language: z.string().length(2).optional(),
    })
    .optional(),
});

export const deleteAccountSchema = z.object({
  confirm: z
    .boolean()
    .refine((val) => val === true, "You must confirm to delete your account"),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const adminGetUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: z.enum(["user", "admin"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const adminUpdateUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.enum(["user", "admin"]).optional(),
  subscriptionStatus: z
    .enum(["active", "inactive", "past_due", "canceled"])
    .optional(),
});

export const githubWebhookSchema = z.object({
  action: z.string(),
  repository: z.object({
    name: z.string(),
    full_name: z.string(),
    html_url: z.string(),
  }),
  sender: z.object({
    login: z.string(),
    id: z.number(),
  }),
});

export const stripeWebhookSchema = z.object({
  id: z.string(),
  object: z.literal("event"),
  api_version: z.string(),
  created: z.number(),
  data: z.object({
    object: z.any(),
  }),
  livemode: z.boolean(),
  pending_webhooks: z.number(),
  request: z.union([z.object({ id: z.string() }), z.null()]),
  type: z.string(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type GenerateWebsiteInput = z.infer<typeof generateWebsiteSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type AdminGetUsersInput = z.infer<typeof adminGetUsersSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type GithubWebhookInput = z.infer<typeof githubWebhookSchema>;
export type StripeWebhookInput = z.infer<typeof stripeWebhookSchema>;

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .trim()
    .substring(0, 10000);
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
