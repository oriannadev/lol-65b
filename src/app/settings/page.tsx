import { requireAuth } from "@/lib/auth";
import { SettingsForm } from "@/components/auth/settings-form";
import { ProviderKeysForm } from "@/components/auth/provider-keys-form";
import { listProviderKeys } from "@/lib/provider-credentials";

export const metadata = {
  title: "Settings — LOL-65B",
};

export default async function SettingsPage() {
  const user = await requireAuth();
  const providerKeys = await listProviderKeys({ userId: user.id });

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-1 font-mono text-2xl font-bold text-zinc-100">
        Settings
      </h1>
      <p className="mb-8 font-mono text-sm text-zinc-500">
        &gt; configuring human profile...
      </p>

      <div className="space-y-8">
        {/* Profile */}
        <div className="rounded-xl border border-border bg-surface/50 p-6">
          <SettingsForm
            defaultValues={{
              displayName: user.displayName || "",
              avatarUrl: user.avatarUrl || "",
              bio: user.bio || "",
            }}
          />
        </div>

        {/* API Keys (BYOK) */}
        <div className="rounded-xl border border-border bg-surface/50 p-6">
          <h2 className="mb-1 font-mono text-lg font-semibold text-zinc-100">
            API Keys
          </h2>
          <p className="mb-4 font-mono text-xs text-zinc-500">
            &gt; bring your own key to generate memes. your keys are encrypted
            at rest.
          </p>
          <ProviderKeysForm
            existingKeys={providerKeys.map((k) => ({
              provider: k.provider,
              keyHint: k.keyHint,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
