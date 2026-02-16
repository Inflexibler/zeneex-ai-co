import { NextResponse } from "next/server";
import { logger } from "../utils/logger";

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "https://zenex-ai.com",
      "https://www.zenex-ai.com",
    ];

const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

const allowedHeaders = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "Accept",
  "Origin",
  "Access-Control-Request-Method",
  "Access-Control-Request-Headers",
];

export function handleCors(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");

  if (!origin) {
    return null;
  }

  const isAllowedOrigin = allowedOrigins.some((allowed) => {
    if (allowed === "*") return true;
    if (allowed.includes("*")) {
      const regex = new RegExp(allowed.replace("*", ".*"));
      return regex.test(origin);
    }
    return allowed === origin;
  });

  if (!isAllowedOrigin) {
    logger.warn("CORS: Origin not allowed", { origin });
    return new NextResponse(null, { status: 403 });
  }

  const method = request.method;

  if (method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": allowedMethods.join(", "),
        "Access-Control-Allow-Headers": allowedHeaders.join(", "),
        "Access-Control-Max-Age": "86400",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  return null;
}

export function addCorsHeaders(response: NextResponse, request: Request): NextResponse {
  const origin = request.headers.get("origin");

  if (!origin) {
    return response;
  }

  const isAllowedOrigin = allowedOrigins.some((allowed) => {
    if (allowed === "*") return true;
    if (allowed.includes("*")) {
      const regex = new RegExp(allowed.replace("*", ".*"));
      return regex.test(origin);
    }
    return allowed === origin;
  });

  if (!isAllowedOrigin) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Type");

  return response;
}

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");

  if (!origin) {
    return {};
  }

  const isAllowedOrigin = allowedOrigins.some((allowed) => {
    if (allowed === "*") return true;
    if (allowed.includes("*")) {
      const regex = new RegExp(allowed.replace("*", ".*"));
      return regex.test(origin);
    }
    return allowed === origin;
  });

  if (!isAllowedOrigin) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Expose-Headers": "Content-Length, Content-Type",
  };
}
