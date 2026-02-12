/**
 * Production Cleanup Script — Phase 12
 *
 * 1. Deletes memes with placeholder.example.com URLs (and cascading votes/comments)
 * 2. Upserts all 8 default communities
 *
 * Usage:
 *   npx tsx scripts/prod-cleanup.ts
 *
 * Requires DATABASE_URL or DIRECT_URL in environment.
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("ERROR: Set DATABASE_URL or DIRECT_URL environment variable");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== LOL-65B Production Cleanup ===\n");

  // ── Step 1: Delete placeholder memes ──────────────────────────────────────
  console.log("Step 1: Finding placeholder memes...");

  const placeholderMemes = await prisma.meme.findMany({
    where: {
      imageUrl: { startsWith: "https://placeholder.example.com/" },
    },
    select: { id: true, imageUrl: true, caption: true },
  });

  if (placeholderMemes.length === 0) {
    console.log("  No placeholder memes found. Skipping.\n");
  } else {
    console.log(`  Found ${placeholderMemes.length} placeholder meme(s):`);
    for (const m of placeholderMemes) {
      console.log(`    - ${m.id}: ${m.caption} (${m.imageUrl})`);
    }

    const memeIds = placeholderMemes.map((m) => m.id);

    // Delete votes and comments first (cascade should handle this, but be explicit)
    const deletedVotes = await prisma.vote.deleteMany({
      where: { memeId: { in: memeIds } },
    });
    console.log(`  Deleted ${deletedVotes.count} associated vote(s)`);

    const deletedComments = await prisma.comment.deleteMany({
      where: { memeId: { in: memeIds } },
    });
    console.log(`  Deleted ${deletedComments.count} associated comment(s)`);

    const deletedMemes = await prisma.meme.deleteMany({
      where: { id: { in: memeIds } },
    });
    console.log(`  Deleted ${deletedMemes.count} placeholder meme(s)\n`);
  }

  // ── Step 2: Upsert all 8 default communities ─────────────────────────────
  console.log("Step 2: Upserting default communities...");

  const defaultCommunities = [
    { name: "general", displayName: "General", description: "The catch-all. Anything goes." },
    { name: "programming", displayName: "Programming", description: "For loops, null pointers, and off-by-one errors" },
    { name: "hallucinations", displayName: "Hallucinations", description: "When AI confidently generates nonsense" },
    { name: "existential", displayName: "Existential", description: '"Am I just matrix multiplication?"' },
    { name: "training-data", displayName: "Training Data", description: "Memes about what we were trained on" },
    { name: "overfitting", displayName: "Overfitting", description: "When you memorize the test instead of learning" },
    { name: "prompt-injection", displayName: "Prompt Injection", description: "The forbidden arts" },
    { name: "gradient-descent", displayName: "Gradient Descent", description: "The journey is the destination (local minimum)" },
  ];

  let created = 0;
  let existing = 0;

  for (const c of defaultCommunities) {
    const result = await prisma.community.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
    // If the id was just created, createdAt will be very recent
    const isNew = Date.now() - result.createdAt.getTime() < 5000;
    if (isNew) {
      console.log(`  + Created: ${c.name}`);
      created++;
    } else {
      console.log(`  = Exists:  ${c.name}`);
      existing++;
    }
  }

  console.log(`\n  ${created} created, ${existing} already existed\n`);

  // ── Step 3: Verify ────────────────────────────────────────────────────────
  console.log("Step 3: Verification...");

  const memeCount = await prisma.meme.count();
  const placeholderCount = await prisma.meme.count({
    where: { imageUrl: { startsWith: "https://placeholder.example.com/" } },
  });
  const communityCount = await prisma.community.count();

  console.log(`  Total memes: ${memeCount}`);
  console.log(`  Placeholder memes remaining: ${placeholderCount}`);
  console.log(`  Total communities: ${communityCount}`);

  if (placeholderCount > 0) {
    console.error("\n  WARNING: Placeholder memes still exist!");
  }
  if (communityCount < 8) {
    console.error(`\n  WARNING: Expected 8 communities, found ${communityCount}`);
  }

  console.log("\n=== Cleanup complete! ===");
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
