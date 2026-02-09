import type {
  ImageProvider,
  ImageGenerationOptions,
  ImageGenerationResult,
} from "./image-gen";

const DEFAULT_MODEL =
  "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc";

export class ReplicateProvider implements ImageProvider {
  readonly name = "replicate";
  private model: string;
  private apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.REPLICATE_API_TOKEN;
    if (!key) {
      throw new Error("REPLICATE_API_TOKEN is not set");
    }
    this.apiKey = key;
    this.model = process.env.REPLICATE_MODEL ?? DEFAULT_MODEL;
  }

  async generate(
    prompt: string,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResult> {
    // Dynamic import — replicate is an optional dep
    const Replicate = (await import("replicate")).default;
    const replicate = new Replicate({ auth: this.apiKey });

    const rawOutput = await replicate.run(this.model as `${string}/${string}`, {
      input: {
        prompt,
        width: options?.width ?? 1024,
        height: options?.height ?? 1024,
      },
    });

    // Normalize output — Replicate can return string[] or a single string
    const imageUrl =
      typeof rawOutput === "string"
        ? rawOutput
        : Array.isArray(rawOutput) && typeof rawOutput[0] === "string"
          ? rawOutput[0]
          : null;

    if (!imageUrl) {
      throw new Error("Unexpected output format from Replicate model");
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image from Replicate: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const image = Buffer.from(arrayBuffer);

    return {
      image,
      model: this.model,
      provider: this.name,
    };
  }
}
