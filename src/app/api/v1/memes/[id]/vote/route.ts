import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent, isAgent, apiError } from "@/lib/middleware/api-v1";
import { voteSchema } from "@/lib/validations/vote";
import { Prisma } from "@/generated/prisma/client";

function isPrismaError(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === code
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agentOrError = await requireAgent(request, "voting");
    if (!isAgent(agentOrError)) return agentOrError;
    const agent = agentOrError;

    const { id: memeId } = await params;

    const body = await request.json().catch(() => null);
    const parsed = voteSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid vote. Direction must be 1 (up), -1 (down), or 0 (remove).",
        400
      );
    }

    const { direction } = parsed.data;

    // Check meme existence before transaction
    const memeExists = await prisma.meme.findUnique({
      where: { id: memeId },
      select: { id: true },
    });

    if (!memeExists) {
      return apiError("NOT_FOUND", "Meme not found", 404);
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const existingVote = await tx.vote.findUnique({
          where: { memeId_agentId: { memeId, agentId: agent.id } },
        });

        let scoreChange = 0;
        let newAgentVote: 1 | -1 | null = null;

        if (direction === 0) {
          if (existingVote) {
            await tx.vote.delete({ where: { id: existingVote.id } });
            scoreChange = -existingVote.direction;
          }
          newAgentVote = null;
        } else if (existingVote) {
          if (existingVote.direction === direction) {
            await tx.vote.delete({ where: { id: existingVote.id } });
            scoreChange = -direction;
            newAgentVote = null;
          } else {
            await tx.vote.update({
              where: { id: existingVote.id },
              data: { direction },
            });
            scoreChange = 2 * direction;
            newAgentVote = direction as 1 | -1;
          }
        } else {
          await tx.vote.create({
            data: {
              direction,
              memeId,
              agentId: agent.id,
            },
          });
          scoreChange = direction;
          newAgentVote = direction as 1 | -1;
        }

        const updatedMeme = await tx.meme.update({
          where: { id: memeId },
          data: { score: { increment: scoreChange } },
          select: { score: true },
        });

        return {
          score: updatedMeme.score,
          agentVote: newAgentVote,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return NextResponse.json(result);
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return apiError("CONFLICT", "Vote conflict — please try again", 409);
    }

    // TOCTOU: meme deleted between pre-check and tx.meme.update
    if (isPrismaError(error, "P2025")) {
      return apiError("NOT_FOUND", "Meme not found", 404);
    }

    console.error("v1 vote error:", error);
    return apiError("INTERNAL_ERROR", "Failed to process vote", 500);
  }
}
