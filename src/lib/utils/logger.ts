type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  requestId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private requestId?: string;

  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  clearRequestId(): void {
    this.requestId = undefined;
  }

  private formatLog(entry: LogEntry): string {
    const parts: string[] = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
    ];

    if (entry.requestId) {
      parts.push(`[${entry.requestId}]`);
    }

    parts.push(entry.message);

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(JSON.stringify(entry.context));
    }

    return parts.join(" ");
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      requestId: this.requestId,
    };

    const formattedLog = this.formatLog(entry);

    switch (level) {
      case "debug":
        if (this.isDevelopment) {
          console.debug(formattedLog);
        }
        break;
      case "info":
        console.info(formattedLog);
        break;
      case "warn":
        console.warn(formattedLog);
        break;
      case "error":
        console.error(formattedLog);
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }

  apiRequest(
    method: string,
    path: string,
    context?: Record<string, unknown>
  ): void {
    this.info(`${method} ${path}`, {
      ...context,
      type: "api_request",
    });
  }

  apiResponse(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: Record<string, unknown>
  ): void {
    this.info(`${method} ${path} - ${statusCode} (${duration}ms)`, {
      ...context,
      type: "api_response",
      statusCode,
      duration,
    });
  }

  dbQuery(
    query: string,
    duration: number,
    rows: number | null,
    context?: Record<string, unknown>
  ): void {
    this.debug(`DB Query (${duration}ms)`, {
      ...context,
      type: "db_query",
      query: query.substring(0, 200),
      rows,
      duration,
    });
  }

  aiRequest(
    provider: string,
    model: string,
    context?: Record<string, unknown>
  ): void {
    this.info(`AI Request: ${provider}/${model}`, {
      ...context,
      type: "ai_request",
      provider,
      model,
    });
  }

  aiResponse(
    provider: string,
    model: string,
    duration: number,
    tokens: number,
    context?: Record<string, unknown>
  ): void {
    this.info(`AI Response: ${provider}/${model} (${duration}ms, ${tokens} tokens)`, {
      ...context,
      type: "ai_response",
      provider,
      model,
      duration,
      tokens,
    });
  }

  authEvent(event: string, context?: Record<string, unknown>): void {
    this.info(`Auth Event: ${event}`, {
      ...context,
      type: "auth_event",
      event,
    });
  }

  paymentEvent(event: string, context?: Record<string, unknown>): void {
    this.info(`Payment Event: ${event}`, {
      ...context,
      type: "payment_event",
      event,
    });
  }

  errorWithStack(message: string, error: Error, context?: Record<string, unknown>): void {
    this.error(message, {
      ...context,
      error: error.message,
      stack: error.stack,
    });
  }
}

export const logger = new Logger();

export function createRequestLogger(requestId: string): Logger {
  const requestLogger = new Logger();
  requestLogger.setRequestId(requestId);
  return requestLogger;
}

export function withLogger<T extends unknown[]>(
  fn: (...args: T) => Promise<unknown>,
  operationName: string
) {
  return async (...args: T): Promise<unknown> => {
    const startTime = Date.now();
    logger.info(`Starting: ${operationName}`);

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      logger.info(`Completed: ${operationName}`, { duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Failed: ${operationName}`, {
        duration,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  };
}
