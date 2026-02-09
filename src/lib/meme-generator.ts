import "server-only";
import { randomUUID } from "node:crypto";
import { getImageProvider } from "@/lib/providers/image-gen";
import type { ImageProviderConfig } from "@/lib/providers/image-gen";
import { checkPromptSafety, sanitizePrompt } from "@/lib/prompt-safety";
import { addCaptions } from "@/lib/caption-overlay";
import { uploadMemeImage, deleteMemeImage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export interface MemeGenerationInput {
  concept: string;
  topCaption?: string;
  bottomCaption?: string;
  /** ID of the human user creating the meme (XOR with agentId) */
  userId?: string;
  /** ID of the agent creating the meme (XOR with userId) */
  agentId?: string;
  /** Caller's own provider key (BYOK). Omit for env fallback (admin/seed only). */
  providerConfig?: ImageProviderConfig;
}

export interface MemeGenerationResult {
  id: string;
  imageUrl: string;
  caption: string;
  promptUsed: string;
  modelUsed: string;
  score: number;
  createdAt: Date;
}

/**
 * Build an optimized image generation prompt from a concept.
 * MVP uses templates; later can be swapped for LLM-based prompt engineering.
 */
function buildImagePrompt(concept: string): string {
  return `cartoon meme style, funny illustration of ${concept}, digital art, colorful, expressive characters, meme format, humorous, trending on reddit`;
}

/**
 * Derive the caption text from input.
 * Uses explicit captions if provided, otherwise the concept itself.
 */
function deriveCaption(input: MemeGenerationInput): {
  topText?: string;
  bottomText?: string;
  displayCaption: string;
} {
  const topText = input.topCaption?.trim() || undefined;
  const bottomText = input.bottomCaption?.trim() || undefined;

  if (topText || bottomText) {
    const parts = [topText, bottomText].filter(Boolean);
    return { topText, bottomText, displayCaption: parts.join(" / ") };
  }

  // Default: concept as bottom text
  return {
    bottomText: input.concept.toUpperCase(),
    displayCaption: input.concept.toUpperCase(),
  };
}

/**
 * Full meme generation pipeline:
 * safety check -> prompt engineering -> image gen -> caption overlay -> upload -> save to DB
 *
 * Uses upload-first pattern: upload image to storage, then create DB record
 * with the final URL atomically. If DB fails, clean up storage.
 */
export async function generateMeme(
  input: MemeGenerationInput
): Promise<MemeGenerationResult> {
  // 1. Safety check — concept AND captions
  const safetyResult = checkPromptSafety(input.concept);
  if (!safetyResult.safe) {
    throw new Error(`Prompt rejected: ${safetyResult.reason}`);
  }

  for (const caption of [input.topCaption, input.bottomCaption]) {
    if (caption) {
      const captionSafety = checkPromptSafety(caption);
      if (!captionSafety.safe) {
        throw new Error(`Caption rejected: ${captionSafety.reason}`);
      }
    }
  }

  // 2. Sanitize + build image prompt
  const sanitized = sanitizePrompt(input.concept);
  const imagePrompt = buildImagePrompt(sanitized);

  // 3. Generate image (use caller's key if provided, env fallback for admin/seed)
  const provider = await getImageProvider(input.providerConfig);
  let result;
  try {
    result = await provider.generate(imagePrompt);
  } catch (err) {
    // Sanitize error messages — strip API keys from any error text
    const rawMsg = err instanceof Error ? err.message : String(err);
    throw new Error(sanitizeErrorMessage(rawMsg));
  }
  const { image, model, provider: providerName } = result;

  // 3b. Validate generated image size (prevent storage abuse)
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  if (image.length > MAX_IMAGE_SIZE) {
    throw new Error("Generated image exceeds maximum size");
  }

  // 4. Add captions
  const { topText, bottomText, displayCaption } = deriveCaption(input);
  const captionedImage = await addCaptions(image, { topText, bottomText });

  // 5. Upload to storage first (generate ID upfront)
  const memeId = randomUUID();
  const imageUrl = await uploadMemeImage(captionedImage, memeId);

  // 6. Create DB record with final URL (atomic — no placeholder)
  try {
    const meme = await prisma.meme.create({
      data: {
        id: memeId,
        imageUrl,
        caption: displayCaption,
        promptUsed: imagePrompt,
        modelUsed: `${providerName}/${model}`,
        userId: input.userId ?? null,
        agentId: input.agentId ?? null,
      },
    });

    return {
      id: meme.id,
      imageUrl: meme.imageUrl,
      caption: meme.caption,
      promptUsed: meme.promptUsed ?? imagePrompt,
      modelUsed: meme.modelUsed ?? `${providerName}/${model}`,
      score: meme.score,
      createdAt: meme.createdAt,
    };
  } catch (dbError) {
    // DB insert failed — clean up the uploaded image
    await deleteMemeImage(memeId).catch(() => {});
    throw dbError;
  }
}

/**
 * Strip API key patterns from error messages to prevent key leakage.
 * Matches HuggingFace (hf_*) and Replicate (r8_*) key formats.
 */
function sanitizeErrorMessage(message: string): string {
  return message.replace(/\b(hf_|r8_)[a-zA-Z0-9_-]+/g, "[REDACTED]");
}
