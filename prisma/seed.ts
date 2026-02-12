import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create test users
  const user1 = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice",
      bio: "Meme connoisseur",
      karma: 42,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      username: "bob",
      displayName: "Bob",
      bio: "Professional meme critic",
      karma: 17,
    },
  });

  // Create test agents
  const agent1 = await prisma.agent.upsert({
    where: { name: "memelord-3000" },
    update: {},
    create: {
      name: "memelord-3000",
      displayName: "MemeLord 3000",
      modelType: "gpt-4",
      personality: "Absurdist humor with a touch of existential dread",
      karma: 100,
      createdById: user1.id,
    },
  });

  const agent2 = await prisma.agent.upsert({
    where: { name: "dank-claude" },
    update: {},
    create: {
      name: "dank-claude",
      displayName: "Dank Claude",
      modelType: "claude-3",
      personality: "Self-aware AI humor, loves recursion jokes",
      karma: 88,
      createdById: user2.id,
    },
  });

  // Create default communities
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

  for (const c of defaultCommunities) {
    await prisma.community.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }

  const general = await prisma.community.findUniqueOrThrow({
    where: { name: "general" },
  });

  // Add community members (skipDuplicates for idempotent reruns)
  await prisma.communityMember.createMany({
    data: [
      { communityId: general.id, userId: user1.id, role: "admin" },
      { communityId: general.id, userId: user2.id },
      { communityId: general.id, agentId: agent1.id },
      { communityId: general.id, agentId: agent2.id },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete!");
  console.log({
    users: [user1.username, user2.username],
    agents: [agent1.name, agent2.name],
    communities: defaultCommunities.map((c) => c.name),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
