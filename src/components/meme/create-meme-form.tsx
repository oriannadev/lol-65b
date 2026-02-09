"use client";

import { useState, useRef, useEffect } from "react";
import type { GenerateMemeInput } from "@/lib/validations/meme";

const LOADING_MESSAGES = [
  "> INITIALIZING HUMOR MODULE...",
  "> CONSULTING THE LATENT SPACE...",
  "> SAMPLING FROM THE MEME DISTRIBUTION...",
  "> APPLYING GRADIENT COMEDY DESCENT...",
  "> COMPUTING OPTIMAL PUNCHLINE...",
  "> RENDERING PIXELS OF PURE JOY...",
  "> RUNNING INFERENCE ON VIBES...",
  "> DENOISING YOUR MASTERPIECE...",
];

interface MemeResult {
  id: string;
  imageUrl: string;
  caption: string;
  promptUsed: string;
  modelUsed: string;
}

interface CreateMemeFormProps {
  disabled?: boolean;
}

export function CreateMemeForm({ disabled = false }: CreateMemeFormProps) {
  const [concept, setConcept] = useState("");
  const [topCaption, setTopCaption] = useState("");
  const [bottomCaption, setBottomCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [result, setResult] = useState<MemeResult | null>(null);
  const [error, setError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up interval on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const cycleMessages = () => {
    let i = 0;
    const interval = setInterval(() => {
      setLoadingMsg(LOADING_MESSAGES[i % LOADING_MESSAGES.length]);
      i++;
    }, 1800);
    intervalRef.current = interval;
    return interval;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    const msgInterval = cycleMessages();
    setLoadingMsg(LOADING_MESSAGES[0]);

    try {
      const body: GenerateMemeInput = { concept };
      if (topCaption.trim()) body.topCaption = topCaption.trim();
      if (bottomCaption.trim()) body.bottomCaption = bottomCaption.trim();

      const res = await fetch("/api/memes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setResult(data.meme);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      clearInterval(msgInterval);
      intervalRef.current = null;
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Concept */}
        <div>
          <label
            htmlFor="concept"
            className="mb-2 block font-mono text-sm text-zinc-400"
          >
            Meme Concept *
          </label>
          <textarea
            id="concept"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="e.g., a for loop that never terminates"
            rows={3}
            maxLength={500}
            required
            disabled={disabled || loading}
            aria-describedby="concept-counter"
            className="w-full rounded-lg border border-border bg-base px-4 py-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-mint/50 focus:outline-none disabled:opacity-50"
          />
          <p id="concept-counter" className="mt-1 font-mono text-xs text-zinc-600" aria-live="polite">
            {concept.length}/500 characters
          </p>
          {concept.trim().length > 0 && concept.trim().length < 3 && (
            <p className="mt-1 font-mono text-xs text-warning">
              Concept must be at least 3 characters
            </p>
          )}
        </div>

        {/* Captions (optional) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="topCaption"
              className="mb-2 block font-mono text-sm text-zinc-400"
            >
              Top Caption
            </label>
            <input
              id="topCaption"
              type="text"
              value={topCaption}
              onChange={(e) => setTopCaption(e.target.value)}
              placeholder="Optional top text"
              maxLength={100}
              disabled={disabled || loading}
              className="w-full rounded-lg border border-border bg-base px-4 py-2.5 font-mono text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-lavender/50 focus:outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label
              htmlFor="bottomCaption"
              className="mb-2 block font-mono text-sm text-zinc-400"
            >
              Bottom Caption
            </label>
            <input
              id="bottomCaption"
              type="text"
              value={bottomCaption}
              onChange={(e) => setBottomCaption(e.target.value)}
              placeholder="Optional bottom text"
              maxLength={100}
              disabled={disabled || loading}
              className="w-full rounded-lg border border-border bg-base px-4 py-2.5 font-mono text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-lavender/50 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={disabled || loading || concept.trim().length < 3}
          className="w-full rounded-lg bg-mint px-6 py-3 font-mono text-sm font-semibold text-black transition-all hover:bg-mint-dim hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-mint disabled:hover:shadow-none"
        >
          {loading ? "Generating..." : "Generate Meme"}
        </button>
      </form>

      {/* Loading state */}
      {loading && (
        <div
          className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface/50 p-8"
          role="status"
          aria-live="polite"
          aria-label="Generating meme, please wait"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint border-t-transparent" aria-hidden="true" />
          <pre className="font-mono text-sm text-mint animate-pulse">
            {loadingMsg}
          </pre>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-error/30 bg-error/5 p-4">
          <p className="font-mono text-sm text-error">&gt; ERROR: {error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4 rounded-xl border border-mint/20 bg-surface/50 p-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-mint">
              &gt; MEME GENERATED SUCCESSFULLY
            </span>
          </div>

          {/* Generated image */}
          <div className="overflow-hidden rounded-lg border border-border">
            <img
              src={result.imageUrl}
              alt={`Generated meme: ${result.caption}`}
              className="w-full"
            />
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <p className="font-mono text-sm text-zinc-400">
              <span className="text-zinc-600">caption:</span> {result.caption}
            </p>
            <p className="font-mono text-xs text-zinc-600">
              model: {result.modelUsed}
            </p>
            <p className="font-mono text-xs text-zinc-600 break-words">
              prompt: {result.promptUsed}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setResult(null);
                setConcept("");
                setTopCaption("");
                setBottomCaption("");
              }}
              className="rounded-lg border border-lavender/30 px-4 py-2.5 font-mono text-xs font-semibold text-lavender transition-all hover:border-lavender hover:shadow-[0_0_20px_rgba(167,139,250,0.2)] focus:outline-none focus:ring-2 focus:ring-lavender/50"
            >
              Create Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
