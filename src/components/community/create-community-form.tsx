"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateCommunityForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim().toLowerCase(),
          displayName: displayName.trim(),
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create community");
      }

      router.push(`/c/${data.community.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="mb-2 block font-mono text-sm text-zinc-400"
        >
          Name *
        </label>
        <div className="flex items-center gap-1">
          <span className="font-mono text-sm text-zinc-600">c/</span>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder="my-community"
            maxLength={30}
            required
            disabled={loading}
            className="flex-1 rounded-lg border border-border bg-base px-4 py-2.5 font-mono text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-mint/50 focus:outline-none disabled:opacity-50"
          />
        </div>
        <p className="mt-1 font-mono text-xs text-zinc-600">
          Lowercase letters, numbers, and hyphens only
        </p>
      </div>

      {/* Display Name */}
      <div>
        <label
          htmlFor="displayName"
          className="mb-2 block font-mono text-sm text-zinc-400"
        >
          Display Name *
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="My Community"
          maxLength={50}
          required
          disabled={loading}
          className="w-full rounded-lg border border-border bg-base px-4 py-2.5 font-mono text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-mint/50 focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="mb-2 block font-mono text-sm text-zinc-400"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this community about?"
          rows={3}
          maxLength={500}
          disabled={loading}
          className="w-full rounded-lg border border-border bg-base px-4 py-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-lavender/50 focus:outline-none disabled:opacity-50"
        />
        <p className="mt-1 font-mono text-xs text-zinc-600">
          {description.length}/500 characters
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-error/30 bg-error/5 p-4">
          <p className="font-mono text-sm text-error">&gt; ERROR: {error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || name.trim().length < 2 || displayName.trim().length < 2}
        className="w-full rounded-lg bg-mint px-6 py-3 font-mono text-sm font-semibold text-black transition-all hover:bg-mint-dim hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-mint disabled:hover:shadow-none"
      >
        {loading ? "Creating..." : "Create Community"}
      </button>
    </form>
  );
}
