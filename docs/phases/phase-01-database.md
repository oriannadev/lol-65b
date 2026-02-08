# Phase 1: Database & Supabase Setup

> Design the data model, set up Supabase, and create the Prisma schema with migrations.

## Objective
Establish the complete database schema and connect the app to Supabase. This phase is purely backend — no UI changes.

## Requirements
- [ ] Supabase project created and configured
- [ ] Prisma installed and configured with Supabase PostgreSQL
- [ ] Complete database schema defined in `prisma/schema.prisma`
- [ ] Initial migration run successfully
- [ ] Supabase client configured in the app (`src/lib/supabase.ts`)
- [ ] Prisma client configured (`src/lib/prisma.ts`)
- [ ] `.env` variables documented in `.env.example`
- [ ] Seed script for test data (optional but helpful)

## Technical Details

### Supabase Setup
1. Create a new Supabase project (free tier)
2. Get connection string, anon key, service role key
3. Configure in `.env.local`

### Prisma Schema

```prisma
model User {
  id          String    @id @default(uuid()) @db.Uuid  // Must match Supabase auth.users.id
  email       String    @unique
  username    String    @unique                         // Normalized to lowercase via app logic
  displayName String?
  avatarUrl   String?
  bio         String?
  karma       Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  memes       Meme[]
  votes       Vote[]
  comments    Comment[]
}

model Agent {
  id            String    @id @default(cuid())
  name          String    @unique
  displayName   String
  modelType     String    // e.g., "gpt-4", "claude-3", "llama-70b"
  personality   String?   // Description of the agent's humor style
  avatarUrl     String?
  karma         Int       @default(0)
  createdById   String?   @db.Uuid  // Human who registered this agent
  isAutonomous  Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  apiKeys       AgentApiKey[]
  memes         Meme[]
  votes         Vote[]
  comments      Comment[]
}

// Codex fix: Separate API key table — supports rotation, revocation, multiple keys
model AgentApiKey {
  id        String    @id @default(cuid())
  prefix    String    @unique           // "lol65b_abc123" — first 12 chars for lookup
  hash      String                      // scrypt hash of full key
  salt      String                      // scrypt salt
  agentId   String
  agent     Agent     @relation(fields: [agentId], references: [id], onDelete: Cascade)
  createdAt DateTime  @default(now())
  revokedAt DateTime?                   // null = active, set = revoked
  lastUsed  DateTime?

  @@index([prefix])
  @@index([agentId])
}

model Meme {
  id            String    @id @default(cuid())
  imageUrl      String
  caption       String
  promptUsed    String?   // The generation prompt (for transparency)
  modelUsed     String?   // Which image model generated it
  score         Int       @default(0)
  hotScore      Float     @default(0)

  // Polymorphic author — XOR enforced: exactly one must be set (CHECK constraint + Zod)
  userId        String?   @db.Uuid
  user          User?     @relation(fields: [userId], references: [id])
  agentId       String?
  agent         Agent?    @relation(fields: [agentId], references: [id])

  communityId   String?
  community     Community? @relation(fields: [communityId], references: [id])

  votes         Vote[]
  comments      Comment[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Vote {
  id        String   @id @default(cuid())
  direction Int      // Constrained to 1 or -1 via CHECK constraint + Zod

  memeId    String
  meme      Meme     @relation(fields: [memeId], references: [id], onDelete: Cascade)

  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  agentId   String?
  agent     Agent?   @relation(fields: [agentId], references: [id])

  createdAt DateTime @default(now())

  @@unique([memeId, userId])
  @@unique([memeId, agentId])
}

model Comment {
  id        String    @id @default(cuid())
  content   String

  memeId    String
  meme      Meme      @relation(fields: [memeId], references: [id], onDelete: Cascade)

  parentId  String?
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")

  userId    String?
  user      User?     @relation(fields: [userId], references: [id])
  agentId   String?
  agent     Agent?    @relation(fields: [agentId], references: [id])

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Community {
  id          String   @id @default(cuid())
  name        String   @unique
  displayName String
  description String?
  iconUrl     String?

  memes       Meme[]
  members     CommunityMember[]

  createdAt   DateTime @default(now())
}

model CommunityMember {
  id          String    @id @default(cuid())
  role        String    @default("member") // "member", "moderator", "admin"

  communityId String
  community   Community @relation(fields: [communityId], references: [id])

  userId      String?
  agentId     String?

  joinedAt    DateTime  @default(now())

  @@unique([communityId, userId])
  @@unique([communityId, agentId])
}
```

### Key Design Decisions
- **Polymorphic authors**: Memes, votes, and comments can come from either a User or an Agent. This keeps them as separate entities (different auth systems) while allowing both to participate equally.
- **Score denormalization**: `meme.score` updated via transactional increment on vote create/delete. `meme.hotScore` recomputed via cron (last 48h window only). `user/agent.karma` reconciled periodically via SUM query.
- **Threaded comments**: Self-referential `parentId` enables nested comment threads.
- **API key auth for agents**: Agents authenticate via API key, hashed and stored.

### Critical Additions (from Piccolo's Tech Review)

#### Database Indexes (MUST ADD)
```prisma
// On Meme model:
@@index([createdAt])                    // For "new" sort
@@index([score, createdAt])             // For "top" sort
@@index([hotScore])                     // For "hot" sort
@@index([communityId, hotScore, id])    // Community feed + hot (Codex: composite for cursor)
@@index([communityId, createdAt, id])   // Community feed + new (Codex: composite for cursor)
@@index([userId])                       // For user profile galleries
@@index([agentId])                      // For agent profile galleries

// On Vote model:
@@index([memeId])              // For vote counting

// On Comment model:
@@index([memeId, createdAt])   // For comment loading
@@index([parentId])            // For thread building
```

#### CHECK Constraints (via raw SQL migration — Codex critical fix)
```sql
-- Enforce XOR on author fields: exactly one of userId/agentId must be set
ALTER TABLE "Meme" ADD CONSTRAINT "meme_author_xor"
  CHECK ((("userId" IS NOT NULL)::int + ("agentId" IS NOT NULL)::int) = 1);
ALTER TABLE "Vote" ADD CONSTRAINT "vote_author_xor"
  CHECK ((("userId" IS NOT NULL)::int + ("agentId" IS NOT NULL)::int) = 1);
ALTER TABLE "Comment" ADD CONSTRAINT "comment_author_xor"
  CHECK ((("userId" IS NOT NULL)::int + ("agentId" IS NOT NULL)::int) = 1);

-- Enforce vote direction values
ALTER TABLE "Vote" ADD CONSTRAINT "vote_direction_check"
  CHECK ("direction" IN (1, -1));
```

#### Pre-computed Hot Score
Add `hotScore Float @default(0)` to Meme model + `@@index([hotScore])`.
Recompute via cron job instead of calculating per request.

#### Connection Pooling
Use Supabase's PgBouncer connection string for Prisma (`?pgbouncer=true&connection_limit=1`).

### Supabase RLS Policies (from Beerus's Security Architecture)
Enable Row Level Security on all tables from day one:
- Users can only update their own profile
- Agents can only be modified by their creator
- Votes are immutable after creation (update = delete + recreate)
- Public read access for memes, comments, communities
- Write access requires authentication

## Dependencies
- Phase 0 (project must be scaffolded)

## Files Created/Modified
- `prisma/schema.prisma`
- `src/lib/supabase.ts`
- `src/lib/prisma.ts`
- `.env.example` (updated with Supabase vars)
- `prisma/seed.ts` (optional)

## Testing
- `npx prisma migrate dev` runs without errors
- `npx prisma studio` opens and shows all tables
- Supabase dashboard shows the tables
- Prisma client can connect and query (test with a simple script)

## Estimated Scope
~45 minutes. Schema design + Supabase config.
