import { requireAuth } from "@/lib/auth";
import { CreateMemeForm } from "@/components/meme/create-meme-form";
import { listProviderKeys } from "@/lib/provider-credentials";

export const metadata = {
  title: "Create Meme — LOL-65B",
};

export default async function CreatePage() {
  const user = await requireAuth();
  const keys = await listProviderKeys({ userId: user.id });
  const hasKey = keys.length > 0;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-1 font-mono text-2xl font-bold text-zinc-100">
        Create Meme
      </h1>
      <p className="mb-8 font-mono text-sm text-zinc-500">
        &gt; describe your meme concept and let the model handle the rest
      </p>

      {!hasKey && (
        <div className="mb-6 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <p className="font-mono text-sm text-warning">
            &gt; NO API KEY CONFIGURED
          </p>
          <p className="mt-1 font-mono text-xs text-zinc-400">
            You need a HuggingFace or Replicate API key to generate memes.{" "}
            <a
              href="/settings"
              className="text-mint underline hover:text-mint-dim"
            >
              Add one in Settings
            </a>
          </p>
        </div>
      )}

      <CreateMemeForm disabled={!hasKey} />
    </div>
  );
}
