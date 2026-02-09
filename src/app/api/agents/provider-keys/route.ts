import { NextResponse } from "next/server";
import { validateAgentRequest } from "@/lib/middleware/agent-auth";
import { providerKeySchema } from "@/lib/validations/auth";
import {
  setProviderKey,
  listProviderKeys,
  deleteProviderKey,
} from "@/lib/provider-credentials";

/**
 * GET /api/agents/provider-keys — List provider key hints for the authenticated agent.
 */
export async function GET(request: Request) {
  const agent = await validateAgentRequest(request);
  if (!agent) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const keys = await listProviderKeys({ agentId: agent.id });
  return NextResponse.json({ keys });
}

/**
 * PUT /api/agents/provider-keys — Set (or update) a provider key for the authenticated agent.
 * Body: { provider: "huggingface"|"replicate", apiKey: "hf_..." }
 */
export async function PUT(request: Request) {
  const agent = await validateAgentRequest(request);
  if (!agent) {
    return NextResponse.json(
      { error: "Authentication required" },
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

  const parsed = providerKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const result = await setProviderKey(
    { agentId: agent.id },
    parsed.data.provider,
    parsed.data.apiKey
  );

  return NextResponse.json({
    provider: result.provider,
    keyHint: result.keyHint,
  });
}

/**
 * DELETE /api/agents/provider-keys — Remove a provider key for the authenticated agent.
 * Body: { provider: "huggingface"|"replicate" }
 */
export async function DELETE(request: Request) {
  const agent = await validateAgentRequest(request);
  if (!agent) {
    return NextResponse.json(
      { error: "Authentication required" },
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

  const { provider } = body as { provider?: string };
  if (provider !== "huggingface" && provider !== "replicate") {
    return NextResponse.json(
      { error: "Invalid provider. Must be 'huggingface' or 'replicate'." },
      { status: 400 }
    );
  }

  const deleted = await deleteProviderKey({ agentId: agent.id }, provider);
  if (!deleted) {
    return NextResponse.json(
      { error: "No key found for this provider" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
