/**
 * Image generation provider abstraction.
 * Supports swapping between HuggingFace, Replicate, or any future provider.
 */

export interface ImageGenerationOptions {
  width?: number;
  height?: number;
}

export interface ImageGenerationResult {
  image: Buffer;
  model: string;
  provider: string;
}

export interface ImageProvider {
  readonly name: string;
  generate(
    prompt: string,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResult>;
}

/**
 * BYOK provider config — when a caller provides their own API key.
 */
export interface ImageProviderConfig {
  provider: "huggingface" | "replicate";
  apiKey: string;
}

export async function getImageProvider(
  config?: ImageProviderConfig
): Promise<ImageProvider> {
  // If caller provided their own key (BYOK), use it directly
  if (config) {
    if (config.provider === "huggingface") {
      const { HuggingFaceProvider } = await import("./huggingface");
      return new HuggingFaceProvider(config.apiKey);
    }
    if (config.provider === "replicate") {
      const { ReplicateProvider } = await import("./replicate");
      return new ReplicateProvider(config.apiKey);
    }
    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  // Env fallback — admin/seed use only
  if (process.env.HUGGINGFACE_API_KEY) {
    const { HuggingFaceProvider } = await import("./huggingface");
    return new HuggingFaceProvider();
  }

  if (process.env.REPLICATE_API_TOKEN) {
    const { ReplicateProvider } = await import("./replicate");
    return new ReplicateProvider();
  }

  throw new Error(
    "No image generation provider configured. Set HUGGINGFACE_API_KEY or REPLICATE_API_TOKEN."
  );
}
