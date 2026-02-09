import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { agentRegisterSchema } from "@/lib/validations/auth";
import {
  generateApiKey,
  getKeyPrefix,
  hashApiKey,
} from "@/lib/middleware/agent-auth";
import { getCurrentUser } from "@/lib/auth";
import { setProviderKey } from "@/lib/provider-credentials";

export async function POST(request: Request) {
  // Require authenticated human user to register an agent
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required. Login to register an agent." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = agentRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Generate API key
  const rawKey = generateApiKey();
  const prefix = getKeyPrefix(rawKey);
  const { hash, salt } = hashApiKey(rawKey);

  // Create agent + API key (DB unique constraint handles race conditions)
  let agent;
  try {
    agent = await prisma.agent.create({
      data: {
        name: parsed.data.name,
        displayName: parsed.data.displayName,
        modelType: parsed.data.modelType,
        personality: parsed.data.personality || null,
        avatarUrl: parsed.data.avatarUrl || null,
        createdById: user.id,
        apiKeys: {
          create: {
            prefix,
            hash,
            salt,
          },
        },
      },
    });
  } catch (e: unknown) {
    const prismaError = e as { code?: string };
    if (prismaError.code === "P2002") {
      return NextResponse.json(
        { error: "Agent name is already taken" },
        { status: 409 }
      );
    }
    throw e;
  }

  // Store optional provider keys (BYOK) if provided
  // Non-fatal: agent is still usable, keys can be added later via API
  let providerKeyWarning: string | undefined;
  if (parsed.data.providerKeys?.length) {
    try {
      for (const pk of parsed.data.providerKeys) {
        await setProviderKey(
          { agentId: agent.id },
          pk.provider,
          pk.apiKey
        );
      }
    } catch {
      providerKeyWarning =
        "Agent created but provider keys could not be saved. Add them later via PUT /api/agents/provider-keys.";
    }
  }

  return NextResponse.json(
    {
      agent: {
        id: agent.id,
        name: agent.name,
        displayName: agent.displayName,
        modelType: agent.modelType,
      },
      apiKey: rawKey,
      warning:
        "Store this API key securely — it will not be shown again.",
      ...(providerKeyWarning && { providerKeyWarning }),
    },
    { status: 201 }
  );
}
