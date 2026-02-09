"use client";

import { useState } from "react";
import { saveProviderKey, removeProviderKey } from "@/app/settings/actions";

interface ProviderKeyInfo {
  provider: "huggingface" | "replicate";
  keyHint: string;
}

interface Props {
  existingKeys: ProviderKeyInfo[];
}

const PROVIDERS = [
  {
    id: "huggingface" as const,
    label: "HuggingFace",
    placeholder: "hf_...",
    helpUrl: "https://huggingface.co/settings/tokens",
    helpText: "Get a free token",
  },
  {
    id: "replicate" as const,
    label: "Replicate",
    placeholder: "r8_...",
    helpUrl: "https://replicate.com/account/api-tokens",
    helpText: "Get an API token",
  },
];

export function ProviderKeysForm({ existingKeys }: Props) {
  const [keys, setKeys] = useState<Map<string, string>>(new Map());
  const [hints, setHints] = useState<Map<string, string>>(
    new Map(existingKeys.map((k) => [k.provider, k.keyHint]))
  );
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [successes, setSuccesses] = useState<Set<string>>(new Set());

  async function handleSave(provider: "huggingface" | "replicate") {
    const apiKey = keys.get(provider)?.trim();
    if (!apiKey) return;

    setErrors((prev) => { const m = new Map(prev); m.delete(provider); return m; });
    setSuccesses((prev) => { const s = new Set(prev); s.delete(provider); return s; });
    setPending((prev) => new Set(prev).add(provider));

    try {
      const result = await saveProviderKey(provider, apiKey);

      if (result.error) {
        setErrors((prev) => new Map(prev).set(provider, result.error!));
      } else {
        setHints((prev) => new Map(prev).set(provider, result.keyHint ?? ""));
        setEditing((prev) => { const s = new Set(prev); s.delete(provider); return s; });
        setKeys((prev) => { const m = new Map(prev); m.delete(provider); return m; });
        setSuccesses((prev) => new Set(prev).add(provider));
        setTimeout(() => setSuccesses((prev) => { const s = new Set(prev); s.delete(provider); return s; }), 3000);
      }
    } catch {
      setErrors((prev) => new Map(prev).set(provider, "Something went wrong. Please try again."));
    } finally {
      setPending((prev) => { const s = new Set(prev); s.delete(provider); return s; });
    }
  }

  async function handleRemove(provider: "huggingface" | "replicate") {
    setPending((prev) => new Set(prev).add(provider));
    try {
      const result = await removeProviderKey(provider);

      if (result.error) {
        setErrors((prev) => new Map(prev).set(provider, result.error!));
      } else {
        setHints((prev) => { const m = new Map(prev); m.delete(provider); return m; });
        setEditing((prev) => { const s = new Set(prev); s.delete(provider); return s; });
      }
    } catch {
      setErrors((prev) => new Map(prev).set(provider, "Something went wrong. Please try again."));
    } finally {
      setPending((prev) => { const s = new Set(prev); s.delete(provider); return s; });
    }
  }

  return (
    <div className="space-y-4">
      {PROVIDERS.map((p) => {
        const hasKey = hints.has(p.id);
        const isEditing = editing.has(p.id);
        const isPending = pending.has(p.id);
        const error = errors.get(p.id);
        const isSuccess = successes.has(p.id);

        return (
          <div key={p.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs text-zinc-400">
                {p.label}
              </label>
              <a
                href={p.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-mint/70 hover:text-mint transition-colors"
              >
                {p.helpText} &rarr;
              </a>
            </div>

            {hasKey && !isEditing ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 font-mono text-sm text-zinc-500">
                  {hints.get(p.id)}
                </div>
                <button
                  type="button"
                  onClick={() => setEditing((prev) => new Set(prev).add(p.id))}
                  disabled={isPending}
                  className="rounded-lg border border-border px-3 py-2.5 font-mono text-xs text-zinc-400 transition-colors hover:border-lavender/50 hover:text-lavender disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(p.id)}
                  disabled={isPending}
                  className="rounded-lg border border-error/20 px-3 py-2.5 font-mono text-xs text-error/70 transition-colors hover:border-error hover:text-error disabled:opacity-50"
                >
                  {isPending ? "..." : "Remove"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={keys.get(p.id) ?? ""}
                  onChange={(e) =>
                    setKeys((prev) => new Map(prev).set(p.id, e.target.value))
                  }
                  placeholder={p.placeholder}
                  disabled={isPending}
                  className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-mint focus:ring-1 focus:ring-mint disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => handleSave(p.id)}
                  disabled={isPending || !keys.get(p.id)?.trim()}
                  className="rounded-lg bg-mint px-4 py-2.5 font-mono text-xs font-semibold text-black transition-all hover:bg-mint-dim disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
                {hasKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing((prev) => { const s = new Set(prev); s.delete(p.id); return s; });
                      setKeys((prev) => { const m = new Map(prev); m.delete(p.id); return m; });
                    }}
                    className="rounded-lg border border-border px-3 py-2.5 font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}

            {error && (
              <p className="font-mono text-xs text-error">{error}</p>
            )}
            {isSuccess && (
              <p className="font-mono text-xs text-mint">Key saved successfully.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
