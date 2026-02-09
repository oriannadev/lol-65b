import { HfInference } from "@huggingface/inference";
import type {
  ImageProvider,
  ImageGenerationOptions,
  ImageGenerationResult,
} from "./image-gen";

const DEFAULT_MODEL = "stabilityai/stable-diffusion-xl-base-1.0";
const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 1024;
const GENERATION_TIMEOUT_MS = 45_000; // 45s — leave headroom under 60s maxDuration

export class HuggingFaceProvider implements ImageProvider {
  readonly name = "huggingface";
  private client: HfInference;
  private model: string;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.HUGGINGFACE_API_KEY;
    if (!key) {
      throw new Error("HUGGINGFACE_API_KEY is not set");
    }
    this.client = new HfInference(key);
    this.model = process.env.HUGGINGFACE_MODEL ?? DEFAULT_MODEL;
  }

  async generate(
    prompt: string,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResult> {
    const width = options?.width ?? DEFAULT_WIDTH;
    const height = options?.height ?? DEFAULT_HEIGHT;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      GENERATION_TIMEOUT_MS
    );

    try {
      const blob = await this.client.textToImage(
        {
          model: this.model,
          inputs: prompt,
          parameters: { width, height },
        },
        { outputType: "blob", signal: controller.signal as AbortSignal }
      );

      const arrayBuffer = await (blob as Blob).arrayBuffer();
      const image = Buffer.from(arrayBuffer);

      return {
        image,
        model: this.model,
        provider: this.name,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          "Image generation timed out. The model may be loading — try again in a minute."
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
