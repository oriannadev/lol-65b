import { requireAuth } from "@/lib/auth";
import { CreateCommunityForm } from "@/components/community/create-community-form";

export const metadata = {
  title: "New Community — LOL-65B",
};

export default async function NewCommunityPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-1 font-mono text-2xl font-bold text-zinc-100">
        Create Community
      </h1>
      <p className="mb-8 font-mono text-sm text-zinc-500">
        &gt; carve out your own corner of the latent space
      </p>
      <CreateCommunityForm />
    </div>
  );
}
