import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { User } from "../types";
import { verifyIdToken } from "../config/firebase";
import { AuthenticationError, AuthorizationError } from "../utils/error-handler";
import { logger } from "../utils/logger";
import { queryOne } from "../config/database";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export interface AuthPayload {
  userId: string;
  firebaseUid: string;
  email: string;
  role: string;
}

export async function createToken(payload: AuthPayload): Promise<string> {
  try {
    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(process.env.JWT_EXPIRES_IN || "7d")
      .sign(JWT_SECRET);

    logger.debug("JWT token created", { userId: payload.userId });
    return token;
  } catch (error) {
    logger.error("Failed to create JWT token", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new AuthenticationError("Failed to create authentication token");
  }
}

export async function verifyToken(token: string): Promise<AuthPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as AuthPayload;
  } catch (error) {
    logger.debug("Failed to verify JWT token", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new AuthenticationError("Invalid or expired token");
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);

    const user = await queryOne<User>(
      "SELECT * FROM users WHERE id = $1",
      [payload.userId]
    );

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    return user;
  } catch (error) {
    logger.debug("Failed to get current user", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthenticationError();
  }

  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();

  if (user.role !== "admin") {
    throw new AuthorizationError();
  }

  return user;
}

export function setAuthCookie(token: string): void {
  cookies().set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export function clearAuthCookie(): void {
  cookies().delete("auth_token");
}

export async function verifyFirebaseToken(token: string): Promise<AuthPayload> {
  try {
    const decoded = await verifyIdToken(token);

    const user = await queryOne<User>(
      "SELECT * FROM users WHERE firebase_uid = $1",
      [decoded.uid]
    );

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    return {
      userId: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    logger.error("Failed to verify Firebase token", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new AuthenticationError("Invalid Firebase token");
  }
}

export function isAuthorized(user: User, requiredRole?: string): boolean {
  if (requiredRole && user.role !== requiredRole) {
    return false;
  }
  return true;
}

export function hasSubscription(
  user: User,
  requiredTier: "free" | "pro" | "enterprise"
): boolean {
  const tierOrder = ["free", "pro", "enterprise"];
  const userTierIndex = tierOrder.indexOf(user.subscriptionTier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);

  if (user.subscriptionStatus !== "active") {
    return false;
  }

  return userTierIndex >= requiredTierIndex;
}

export function checkRateLimit(
  user: User,
  action: string,
  limit: number
): { allowed: boolean; remaining: number } {
  if (user.role === "admin") {
    return { allowed: true, remaining: limit };
  }

  const tierLimits: Record<string, number> = {
    free: 5,
    pro: 50,
    enterprise: -1,
  };

  const userLimit = tierLimits[user.subscriptionTier];

  if (userLimit === -1) {
    return { allowed: true, remaining: limit };
  }

  return {
    allowed: userLimit > 0,
    remaining: Math.max(0, userLimit),
  };
}
