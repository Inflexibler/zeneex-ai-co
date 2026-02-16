import {
  ERROR_CODES,
  ERROR_MESSAGES,
  HTTP_STATUS_CODES,
} from "../config/constants";
import { logger } from "./logger";

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    statusCode: number = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY,
      true,
      details
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(
      message,
      ERROR_CODES.UNAUTHORIZED,
      HTTP_STATUS_CODES.UNAUTHORIZED,
      true
    );
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "You do not have permission to access this resource") {
    super(
      message,
      ERROR_CODES.FORBIDDEN,
      HTTP_STATUS_CODES.FORBIDDEN,
      true
    );
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(
      `${resource} not found`,
      ERROR_CODES.NOT_FOUND,
      HTTP_STATUS_CODES.NOT_FOUND,
      true
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(
      message,
      ERROR_CODES.CONFLICT,
      HTTP_STATUS_CODES.CONFLICT,
      true
    );
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded") {
    super(
      message,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      HTTP_STATUS_CODES.TOO_MANY_REQUESTS,
      true
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed") {
    super(
      message,
      ERROR_CODES.DATABASE_ERROR,
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      false
    );
  }
}

export class AIServiceError extends AppError {
  constructor(message: string = "AI service unavailable") {
    super(
      message,
      ERROR_CODES.AI_SERVICE_ERROR,
      HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
      true
    );
  }
}

export class PaymentError extends AppError {
  constructor(message: string = "Payment processing failed") {
    super(
      message,
      ERROR_CODES.PAYMENT_ERROR,
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      true
    );
  }
}

export class SubscriptionError extends AppError {
  constructor(message: string = "Subscription error occurred") {
    super(
      message,
      ERROR_CODES.SUBSCRIPTION_ERROR,
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      true
    );
  }
}

export class GitHubError extends AppError {
  constructor(message: string = "GitHub integration error") {
    super(
      message,
      ERROR_CODES.GITHUB_ERROR,
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      true
    );
  }
}

export function handleError(error: unknown): {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
} {
  if (error instanceof AppError) {
    logger.warn(error.message, {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
    });

    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    logger.error("Unhandled error", {
      error: error.message,
      stack: error.stack,
    });

    return {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    };
  }

  logger.error("Unknown error type", { error });

  return {
    code: ERROR_CODES.INTERNAL_ERROR,
    message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
    statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
  };
}

export function asyncHandler<T extends unknown[]>(
  fn: (...args: T) => Promise<unknown>
) {
  return async (...args: T): Promise<void> => {
    try {
      await fn(...args);
    } catch (error) {
      const handled = handleError(error);
      throw new AppError(handled.message, handled.code, handled.statusCode);
    }
  };
}

export function createErrorResponse(
  code: string,
  message?: string,
  details?: Record<string, unknown>
) {
  return {
    success: false,
    error: {
      code,
      message: message || ERROR_MESSAGES[code] || "An error occurred",
      details,
    },
  };
}

export function createSuccessResponse<T>(data: T) {
  return {
    success: true,
    data,
  };
}

export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
