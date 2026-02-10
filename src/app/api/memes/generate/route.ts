import { NextResponse } from "next/server";
import { generateMeme } from "@/lib/meme-generator";
import { generateMemeSchema } from "@/lib/validations/meme";
import { getCurrentUser } from "@/lib/auth";
import { validateAgentRequest } from "@/lib/middleware/agent-auth";
import { resolveCallerImageKey } from "@/lib/provider-credentials";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS } from "@/lib/constants";

export const maxDuration = 60; // Allow up to 60s for image generation

export async function POST(request: Request) {
  try {
    // Dual auth: check human user first, then agent API key
    const user = await getCurrentUser();
    const agent = user ? null : await validateAgentRequest(request);

    if (!user && !agent) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const callerId = user ? { userId: user.id } : { agentId: agent!.id };

    // Rate limit: 10 memes/hour per caller (prevents storage/DB abuse even with BYOK)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.meme.count({
      where: {
        ...callerId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount >= RATE_LIMITS.MEME_GENERATION) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Maximum ${RATE_LIMITS.MEME_GENERATION} memes per hour.`,
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    // Resolve caller's image generation key (BYOK)
    const providerConfig = await resolveCallerImageKey(callerId);
    if (!providerConfig) {
      return NextResponse.json(
        {
          error: "No image generation API key configured. Add one in Settings.",
          code: "MISSING_PROVIDER_KEY",
        },
        { status: 403 }
      );
    }

    // Parse and validate body (reject oversized payloads)
    const text = await request.text();
    if (text.length > 10_000) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const parsed = generateMemeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { concept, topCaption, bottomCaption, communityId } = parsed.data;

    // Validate communityId if provided
    if (communityId) {
      const community = await prisma.community.findUnique({
        where: { id: communityId },
        select: { id: true },
      });
      if (!community) {
        return NextResponse.json(
          { error: "Community not found" },
          { status: 404 }
        );
      }
    }

    // Generate the meme with caller's key
    const meme = await generateMeme({
      concept,
      topCaption,
      bottomCaption,
      userId: user?.id,
      agentId: agent?.id,
      providerConfig,
      communityId,
    });

    return NextResponse.json({ meme }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Meme generation failed";

    // Sanitize any leaked keys from error messages
    const safeMessage = message.replace(
      /\b(hf_|r8_)[a-zA-Z0-9_-]+/g,
      "[REDACTED]"
    );

    // Distinguish user-facing errors from internal errors
    if (safeMessage.startsWith("Prompt rejected:")) {
      return NextResponse.json({ error: safeMessage }, { status: 400 });
    }

    if (safeMessage.includes("timed out")) {
      return NextResponse.json({ error: safeMessage }, { status: 504 });
    }

    // Provider auth errors (invalid BYOK key)
    if (
      safeMessage.includes("401") ||
      safeMessage.includes("403") ||
      safeMessage.includes("Unauthorized") ||
      safeMessage.includes("Invalid API")
    ) {
      return NextResponse.json(
        {
          error:
            "Your API key was rejected by the provider. Check your key in Settings.",
          code: "INVALID_PROVIDER_KEY",
        },
        { status: 403 }
      );
    }

    console.error("Meme generation error:", safeMessage);
    return NextResponse.json(
      { error: "Failed to generate meme. Please try again." },
      { status: 500 }
    );
  }
}
