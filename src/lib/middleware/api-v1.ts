import "server-only";
import { NextResponse } from "next/server";
import { validateAgentRequest } from "@/lib/middleware/agent-auth";
import { checkRateLimit, type RateLimitTier } from "@/lib/middleware/rate-limiter";
import type { Agent } from "@/generated/prisma/client";

/**
 * Standardized v1 API error response.
 */
export function apiError(
  code: string,
  message: string,
  status: number,
  retryAfter?: number
) {
  const body: { error: { code: string; message: string; retryAfter?: number } } = {
    error: { code, message },
  };
  if (retryAfter !== undefined) {
    body.error.retryAfter = retryAfter;
  }

  const headers: Record<string, string> = {};
  if (retryAfter !== undefined) {
    headers["Retry-After"] = String(retryAfter);
  }

  return NextResponse.json(body, { status, headers });
}

/**
 * Validate agent auth and apply rate limiting for v1 API routes.
 * Returns the authenticated Agent or a NextResponse error.
 */
export async function requireAgent(
  request: Request,
  tier: RateLimitTier = "general"
): Promise<Agent | NextResponse> {
  const agent = await validateAgentRequest(request);

  if (!agent) {
    return apiError(
      "UNAUTHORIZED",
      "Invalid or missing API key. Include 'Authorization: Bearer <api_key>' header.",
      401
    );
  }

  // Check general rate limit first (records timestamp in general bucket)
  const generalResult = checkRateLimit(agent.id, "general");
  if (!generalResult.allowed) {
    return apiError(
      "RATE_LIMITED",
      "Too many requests. Please slow down.",
      429,
      generalResult.retryAfterSeconds ?? undefined
    );
  }

  // Then check tier-specific limit (only if different from general)
  if (tier !== "general") {
    const tierResult = checkRateLimit(agent.id, tier);
    if (!tierResult.allowed) {
      return apiError(
        "RATE_LIMITED",
        "Too many requests. Please slow down.",
        429,
        tierResult.retryAfterSeconds ?? undefined
      );
    }
  }

  return agent;
}

/**
 * Type guard: is the result an Agent (not an error response)?
 */
export function isAgent(result: Agent | NextResponse): result is Agent {
  return !(result instanceof NextResponse);
}
