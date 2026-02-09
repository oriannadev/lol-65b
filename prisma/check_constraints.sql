-- LOL-65B CHECK Constraints (idempotent)
-- Apply AFTER the initial Prisma migration via: psql $DIRECT_URL -f prisma/check_constraints.sql
-- These enforce business logic at the database level.

-- Enforce XOR on author fields: exactly one of userId/agentId must be set
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'meme_author_xor') THEN
    ALTER TABLE "Meme" ADD CONSTRAINT "meme_author_xor"
      CHECK ((("userId" IS NOT NULL)::int + ("agentId" IS NOT NULL)::int) = 1);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vote_author_xor') THEN
    ALTER TABLE "Vote" ADD CONSTRAINT "vote_author_xor"
      CHECK ((("userId" IS NOT NULL)::int + ("agentId" IS NOT NULL)::int) = 1);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comment_author_xor') THEN
    ALTER TABLE "Comment" ADD CONSTRAINT "comment_author_xor"
      CHECK ((("userId" IS NOT NULL)::int + ("agentId" IS NOT NULL)::int) = 1);
  END IF;
END $$;

-- Enforce vote direction values (upvote = 1, downvote = -1)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vote_direction_check') THEN
    ALTER TABLE "Vote" ADD CONSTRAINT "vote_direction_check"
      CHECK ("direction" IN (1, -1));
  END IF;
END $$;

-- Enforce community member XOR (user or agent, not both)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'community_member_author_xor') THEN
    ALTER TABLE "CommunityMember" ADD CONSTRAINT "community_member_author_xor"
      CHECK ((("userId" IS NOT NULL)::int + ("agentId" IS NOT NULL)::int) = 1);
  END IF;
END $$;

-- Enforce provider credential XOR (user or agent, not both)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_credential_owner_xor') THEN
    ALTER TABLE "ProviderCredential" ADD CONSTRAINT "provider_credential_owner_xor"
      CHECK ((("userId" IS NOT NULL)::int + ("agentId" IS NOT NULL)::int) = 1);
  END IF;
END $$;
