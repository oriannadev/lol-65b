# LOL-65B — Phase Progression Tracker

> Updated after each phase is verified and committed.

## Overview

| Phase | Name | Status | Session | Date | Notes |
|-------|------|--------|---------|------|-------|
| 0 | Project Bootstrap | `done` | 1-2 | 2026-02-08 | NVM lazy-load workaround needed, background agent Bash denied |
| 1 | Database & Supabase | `done` | 3 | 2026-02-08 | Schema pushed, constraints applied, seeded, 2x Codex review |
| 2 | Authentication | `done` | 4 | 2026-02-08 | Dual auth: Supabase SSR + agent API keys, 20 new files, Z Fighter team |
| 3 | Meme Generation Engine | `done` | 5 | 2026-02-08 | Provider abstraction, prompt safety, caption overlay, Z Fighter + Codex review |
| 4 | Core Feed | `done` | 6 | 2026-02-09 | Feed API, cursor pagination, sort/period, infinite scroll, Codex-reviewed |
| — | BYOK (cross-cutting) | `done` | 7 | 2026-02-09 | Encrypted provider key storage, BYOK enforcement, Settings UI, agent key API, Codex + Beerus reviewed |
| 5 | Meme Interactions (MVP!) | `done` | 8 | 2026-02-09 | Vote API, optimistic UI, detail page, share button, Codex-reviewed (6 findings, all fixed) |
| 6 | Comments System | `done` | 9 | 2026-02-09 | Threaded comments, dual auth, comment count in feed, Codex-reviewed (6 findings, all fixed) |
| 7 | Agent & User Profiles | `done` | 10 | 2026-02-09 | Profile pages, stats, galleries, author links, DiceBear avatars, Codex-reviewed (6 findings, all fixed) |
| 8 | Agent REST API | `done` | 11 | 2026-02-09 | v1 REST API, rate limiter, agent auth wrapper, API docs page, Codex-reviewed (4 findings, 2 fixed) |
| 9 | Communities | `done` | 12 | 2026-02-09 | Community CRUD, join/leave, filtered feeds, directory, 8 defaults seeded, Codex-reviewed (3 findings, 2 fixed) |
| 10 | Autonomous Agent System | `done` | 13 | 2026-02-10 | 5 autonomous agents, LLM-driven memes/comments, admin dashboard, cron scheduling, Codex-reviewed (5 findings, 4 fixed) |
| 11 | Polish & Deploy | `done` | 14 | 2026-02-10 | CSP fix, error/404 pages, SEO (sitemap/robots/manifest/OG), hero banner, footer, README upgrade, Vercel deployed |
| 12 | Data Cleanup & Quick Wins | `done` | 15 | 2026-02-12 | Delete placeholder memes, seed missing communities, image error fallback, next.config images |
| 13 | Production Hardening | `done` | 16 | 2026-02-12 | Upstash Redis rate limiter, async scrypt, CDN cache headers, concurrency guard, Codex-reviewed (3 findings, 2 fixed) |
| 14 | Visual Overhaul | `done` | 17 | 2026-02-12 | lucide-react icons, motion animations, glassmorphism, shimmer loaders, animated gradients, Codex-reviewed (0 critical, 2 minor warnings) |

## Milestones

- [x] **MVP** — Phase 5 complete (generation + feed + voting)
- [x] **Social Platform** — Phase 7 complete (comments + profiles)
- [x] **Agent Ecosystem** — Phase 10 complete (API + communities + autonomous bots)
- [x] **Public Launch** — Phase 11 complete (deployed and live at https://lol-65b.vercel.app)
- [x] **Data Cleanup** — Phase 12 complete (placeholder memes deleted, all communities seeded, image fallbacks)
- [x] **Production Hardened** — Phase 13 complete (Redis-backed rate limiting, async crypto, CDN caching, generation concurrency guard)
- [x] **Visual Overhaul** — Phase 14 complete (lucide-react icons, motion animations, glassmorphism, shimmer loaders, animated gradients)

## Session Log

### Phase 0 — 2026-02-08
- **Session**: Sessions 1-2 (context compaction between them)
- **Commit**: `1059c3a` — Complete Phase 0: Next.js scaffold with LOL-65B identity
- **Duration**: ~45min (across 2 sessions, including Z Fighter strategy review + Codex review)
- **Issues encountered**: NVM lazy-load recursive loops in WSL zsh; background agent Bash permissions auto-denied
- **Resolution**: Use absolute node paths; killed stuck agent, built Phase 0 from main context

### Phase 1 (code) — 2026-02-08
- **Session**: Session 3
- **Commit**: `b37b738` — Complete Phase 1: Database schema, Prisma config, and Supabase clients
- **Duration**: Multi-session (code written in session 2, Codex-reviewed, committed in session 3)
- **Issues encountered**: Prisma 7 import path changes, generator name change, ESM seed runner
- **Resolution**: Documented in memory; tsx for seed, explicit adapter config

### Phase 1 (infra) — 2026-02-08
- **Session**: Session 3 (continued)
- **Supabase project**: `nmbsbwluektieoxqtrvc` (us-east-1)
- **Issues encountered**: Supabase direct DB host (db.*) is IPv6-only, unreachable from WSL; pooler hostname was aws-1 not aws-0
- **Resolution**: Use pooler session mode (port 5432) for DIRECT_URL; discovered correct hostname via Supabase API
- **Codex review**: 3 warnings found, all fixed + verified in follow-up review (2 rounds)

### Phase 2 — 2026-02-08
- **Session**: Session 4
- **Commit**: `3044a7b` — Add Phase 2: dual authentication (Supabase Auth + agent API keys)
- **Duration**: ~30min
- **Approach**: Z Fighter team (Android 18, Gohan, Vegeta, Piccolo) — Vegeta solo'd most of the work
- **Files**: 20 new, 2 modified (package.json, layout.tsx, supabase.ts)
- **Key additions**: @supabase/ssr cookie-based auth, scrypt API key hashing, Next.js middleware for session refresh + route protection, auth pages (login/signup), agent registration API, settings page
- **Issues encountered**: NVM lazy-load still breaks in bash (known); Z Fighter agents slow to start (Vegeta compensated); Next.js 16 deprecated "middleware" in favor of "proxy" (warning only, still works)
- **Resolution**: Wrote most files from main context + Vegeta; build passes clean

### Phase 3 — 2026-02-08
- **Session**: Session 5
- **Commit**: `61c2df6` — Add Phase 3: Meme Generation Engine with provider abstraction and safety pipeline
- **Duration**: ~1hr
- **Approach**: Z Fighter team (Piccolo=security, Gohan=UX, Vegeta=code quality) + Codex cross-model review (4 independent review passes)
- **Files**: 11 new, 2 modified (package.json, navbar.tsx)
- **Key additions**: HuggingFace/Replicate provider abstraction, prompt injection defense (16 patterns + NSFW filter + normalization), Sharp SVG caption overlay, Supabase Storage upload/delete helpers, full meme generation pipeline (safety → prompt → image gen → caption → upload → DB), /create page + form component, /api/memes/generate endpoint with dual auth
- **Dependencies added**: @huggingface/inference, sharp, replicate, @types/sharp
- **Issues encountered**: HfInference textToImage TypeScript overload (string vs Blob), Zod v4 import path mismatch, race condition in create-then-update DB pattern, Sharp dual-instance memory leak, no API timeout, XML injection in caption overlay, system: regex false positive on "solar system", interval leak on unmount
- **Resolution**: outputType:"blob" cast, matched existing zod import, upload-first pattern with randomUUID, sharp .clone(), AbortController 45s timeout, non-ASCII stripping + entity escaping, tightened regex to line-start only, useRef + useEffect cleanup

### Phase 4 — 2026-02-09
- **Session**: Session 6
- **Commit**: `e7e1d6f` — Add Phase 4: Core Feed with cursor pagination, sorting, and infinite scroll
- **Duration**: ~25min
- **Approach**: Direct build + Codex cross-model review (5 findings, all fixed)
- **Files**: 7 new, 2 modified (page.tsx, utils.ts) + next-env.d.ts auto-update
- **Key additions**: Feed API (GET /api/memes) with cursor pagination and Zod-validated sort/period params, MemeCard/MemeGrid/MemeSkeleton components, FeedControls (sort tabs + period filter), Feed client component with IntersectionObserver infinite scroll, timeAgo utility
- **Codex findings fixed**: (1) graceful deleted-cursor recovery via isPrismaNotFound, (2) AbortController for stale fetch race conditions, (3) fetchingRef guard against IntersectionObserver double-fire, (4) timeAgo NaN/future date guard
- **Security audit**: .env gitignored, .env.example has only empty placeholders, no secrets tracked in git

### BYOK (Bring Your Own Key) — 2026-02-09
- **Session**: Session 7
- **Commit**: `430ea8b` — Add BYOK (Bring Your Own Key) for image generation providers
- **Duration**: ~30min
- **Approach**: Z Fighter team deployed (Vegeta, Piccolo) but lead completed all 10 steps before fighters finished loading. Codex cross-model review (8 findings, 6 fixed). Beerus security audit contributed to plan (7 findings).
- **Files**: 5 new, 13 modified (+888 lines, -45 lines)
- **Key additions**: AES-256-GCM encryption with AAD binding + key rotation support, ProviderCredential model (polymorphic XOR), encrypted CRUD for provider keys, provider factory refactor (BYOK param), meme pipeline BYOK enforcement (403 if no key), rate limiting (10/hr per caller), error sanitization (strip hf_*/r8_* patterns), Settings UI for API key management, agent provider-keys API (GET/PUT/DELETE), create page no-key guard
- **Codex findings fixed**: (1) removeProviderKey ignoring delete result, (2) listProviderKeys empty-owner data leak, (3) agent registration non-transactional key writes, (4) AAD missing owner type, (5) client form missing try/catch, (6) setProviderKey missing XOR guard
- **Codex deferred**: provider fallback preference (always HF-first), attempt-level rate limiting
- **Issues encountered**: Z Fighter agents couldn't resolve NVM/node paths (known WSL issue); fighters never wrote code before lead finished
- **Resolution**: Lead completed everything directly; fighters shut down post-mission

### Phase 5 (MVP!) — 2026-02-09
- **Session**: Session 8
- **Commit**: `a382078` — Add Phase 5: Voting & Detail Page — MVP COMPLETE
- **Duration**: ~15min
- **Approach**: Direct build + Codex cross-model review (6 findings, all fixed)
- **Files**: 7 new, 4 modified
- **Key additions**: Vote API endpoint (POST /api/memes/[id]/vote) with Serializable transaction + P2002 race handling, VoteButtons component with ref-based guard + functional state updates for optimistic UI, meme detail page (/meme/[id]) with full-size image + metadata, ShareButton (copy link with clipboard API + fallback), MemeMetaDisplay (prompt/model/date transparency), feed API extended with userVote per meme
- **Codex findings fixed**: (1) HIGH — vote transaction race condition: added Serializable isolation + P2002 catch, (2) MEDIUM — stale closure in optimistic updates: functional setScore/setUserVote, (3) MEDIUM — submitting guard bypass: ref-based instead of state-based, (4-5) LOW — unsafe direction casts: runtime validation, (6) LOW — execCommand fallback: check return value
- **Issues encountered**: None — cleanest phase yet
- **MVP milestone reached**: sign up → generate meme → feed → vote → detail page

### Phase 6 — 2026-02-09
- **Session**: Session 9
- **Commit**: `aa8f6fa` — Add Phase 6: Comments System with threaded replies
- **Duration**: ~15min
- **Approach**: Direct build + Codex cross-model review (4 warnings, 2 nits — all fixed)
- **Files**: 8 new, 4 modified (+831 lines)
- **Key additions**: Comment API (GET/POST/DELETE /api/memes/[id]/comments), threaded comment UI (3-level depth cap enforced server-side), CommentSection/CommentForm/CommentItem/CommentThread components, CommentCount on feed MemeCards, abort-safe fetch with loading reset, Zod validation (1-1000 chars), dual auth for all endpoints
- **Codex findings fixed**: (1) WARNING — isOwn only checked human users, not agents: added agent auth to GET, (2) WARNING — unbounded nesting depth: added server-side ancestor walk + 3-level cap, (3) WARNING — fetch race could overwrite optimistic state: abort-signal guard on setState, (4) WARNING — no comment limit: added take:500 soft cap, (5) nit — loading not reset on memeId change: set loading=true in fetchComments, (6) nit — isOverLimit used raw length: switched to trimmed length
- **Issues encountered**: None — clean phase

### Phase 7 — 2026-02-09
- **Session**: Session 10
- **Commit**: `92cc48f` — Add Phase 7: Agent & User Profiles with stats, galleries, and author links
- **Duration**: ~15min
- **Approach**: Direct build + Codex cross-model review (1 critical, 5 warnings — all fixed)
- **Files**: 11 new, 5 modified (+708 lines)
- **Key additions**: User profiles at /u/[username] with meme gallery, stats grid, top meme highlight. Agent profiles at /agent/[name] with identity card (model, personality, creator, autonomous badge). /me redirect page for navbar. DiceBear generated avatars (bottts-neutral for agents, initials for humans). ProfileStats (total memes, karma, avg score, comments). Author names are now clickable links to profiles everywhere (meme cards, detail page, comments). Navbar shows profile link + settings gear. Username stored in user_metadata on signup.
- **Codex findings fixed**: (1) CRITICAL — profile URL path not encoded: added encodeURIComponent, (2) WARNING — agent-identity hardcoded /u/ URL: use getProfileUrl, (3) WARNING — avatar.ts no URL scheme validation: check https/http prefix, (4) WARNING — agent page name not lowercased: added .toLowerCase(), (5) WARNING — avgScore hid negatives: show all finite values, (6) WARNING — <a> instead of <Link> for top meme: switched to Next.js Link
- **Issues encountered**: None — clean phase
- **Social Platform milestone reached**: comments + profiles complete

### Phase 8 — 2026-02-09
- **Session**: Session 11
- **Commit**: `170bef6` — Add Phase 8: Agent REST API with rate limiting and API docs
- **Duration**: ~15min
- **Approach**: Direct build + Codex cross-model review (4 findings: 2 MEDIUM fixed, 2 LOW deferred)
- **Files**: 8 new
- **Key additions**: Agent REST API at /api/v1/* with API key auth, in-memory sliding window rate limiter (60/min general, 10/hr meme gen, 120/min voting), page-based pagination for v1 feed, standardized error format ({ error: { code, message, retryAfter? } }), agent profile endpoint with parallel stats queries, API documentation page at /docs/api
- **Codex findings fixed**: (1) MEDIUM — vote TOCTOU race: added P2025 catch for meme deleted between pre-check and transaction, (2) MEDIUM — empty string parentId FK error: normalized with `||` instead of `??`
- **Codex deferred**: (3) LOW — in-memory rate limiter per-process (spec says MVP), (4) LOW — tier quota consumed before general check (acceptable behavior)
- **Issues encountered**: TypeScript type narrowing issue with transaction `as const` return — moved meme existence check outside tx and added P2025 fallback catch

### Phase 9 — 2026-02-09
- **Session**: Session 12
- **Commit**: `95a18ce` — Add Phase 9: Communities with directory, join/leave, and filtered feeds
- **Duration**: ~15min
- **Approach**: Direct build + Codex cross-model review (3 findings: 2 warnings fixed, 1 nit deferred)
- **Files**: 12 new, 11 modified (+1100 lines)
- **Key additions**: Community CRUD API (GET list, POST create with transaction + P2002), community detail API with top agents + membership check, join/leave toggle (dual auth, race-safe with P2002/P2025 handling), community directory page (/communities), community page (/c/[name]) with filtered feed + sidebar, create community page (/communities/new), community selector on meme creation, 8 default communities seeded, navbar Communities link, communityId filter on feed API + v1 API
- **Codex findings fixed**: (1) WARNING — top agents ordered by total meme count not community-specific: sort in JS by filtered _count, (2) WARNING — join/leave race condition: catch P2002 on create, P2025 on delete
- **Codex deferred**: (3) NIT — duplicated community detail query in API route + page (cosmetic, MVP scale)
- **Issues encountered**: None — clean phase

### Phase 10 — 2026-02-10
- **Session**: Session 13
- **Commit**: `0dea828` — Add Phase 10 + remove client-side admin email exposure
- **Duration**: ~20min
- **Approach**: Z Fighter team (Gohan assigned admin dashboard) + lead handled all core agent logic. Codex cross-model review (5 warnings, 4 fixed, 1 deferred).
- **Files**: 15 new, 3 modified (+1200 lines)
- **Key additions**: 5 autonomous AI agents with distinct personalities (NullPointer 9000, Hallucinate-O-Matic, Gradient Gary, Tokenizer Todd, Overfitter Ollie). HF Inference chatCompletion wrapper for LLM text gen. Personality-driven meme concept + comment generators. Weighted voting system (keyword match + probability). Full agent run loop (browse → vote → generate → post → comment). Scheduler with stochastic batching (1-3 agents per run). Vercel Cron every 4 hours. AgentActivity tracking model. Admin dashboard with agent toggles, activity feed, manual batch trigger. Navbar admin link.
- **Codex findings fixed**: (1) WARNING — seed-agents re-enabled disabled agents on upsert: removed isAutonomous from update block, (2) WARNING — dead ternary in run completion: fixed to use run_failed for error runs, (3) WARNING — AbortController signal not passed to chatCompletion: added signal param, (4) WARNING — toggleAll affected user-created agents: scoped to system agent names
- **Codex deferred**: (5) WARNING — NEXT_PUBLIC_ADMIN_EMAIL exposes admin email client-side (UI-only, server enforces auth)
- **Issues encountered**: Lead was faster than Z Fighter (Gohan); completed all files before teammate could start
- **Resolution**: Shut down Gohan, lead handled everything directly

### Phase 11 — 2026-02-10
- **Session**: Session 14
- **Commits**: `8abfee3` — Phase 11 polish, `d69ff42` — cron fix, `8066f06` — middleware fix
- **Duration**: ~20min
- **Approach**: Direct build, no Z Fighter team needed (all code changes + Vercel API deployment)
- **Files**: 9 new, 6 modified (+466 lines)
- **Key additions**: CSP header fix (api.dicebear.com for DiceBear avatars), global error boundary with retry, custom 404 page with branding, dynamic sitemap (memes/communities/users/agents), robots.txt, web app manifest (PWA metadata), edge-rendered OG image, hero welcome banner, site footer, .env.example updated with Phase 10 vars, full README rewrite (features, tech stack table, deploy guide, env var reference)
- **Deployment**: Vercel Hobby tier at https://lol-65b.vercel.app. 11 env vars set via API. Cron changed to daily (Hobby limit). Middleware updated to allow public access to SEO routes, content pages, and community/profile/meme detail pages.
- **Verification**: Homepage 200, robots.txt valid, sitemap.xml with dynamic routes, manifest.webmanifest valid JSON, OG image 200 (image/png), communities 200, API docs 200, cron 401 (correct — needs auth), cron with auth 200.
- **Issues encountered**: (1) Community model has no updatedAt — used createdAt instead, (2) Vercel Hobby cron limit — changed from every 4h to daily, (3) Middleware blocking sitemap/robots/public pages — expanded public route list
- **Resolution**: All fixed inline before deploy

### Phase 12 — 2026-02-12
- **Session**: Session 15
- **Commit**: (pending)
- **Duration**: ~10min
- **Approach**: Direct build — bugs already diagnosed from triple-review (Codex, exploration agent, manual inspection)
- **Files**: 1 new component, 1 new script, 4 modified (seed.ts, meme-card.tsx, meme-detail.tsx, next.config.ts)
- **Key actions**: (1) Deleted 2 placeholder memes from production DB (cascaded 11 votes, 2 comments), (2) Seeded 7 missing communities on production (programming, hallucinations, existential, training-data, overfitting, prompt-injection, gradient-descent), (3) Fixed seed.ts to not create placeholder memes on future re-runs, (4) Created MemeImage client component with onError fallback (shows placeholder icon on broken images), (5) Updated meme-card.tsx and meme-detail.tsx to use MemeImage, (6) Added images.remotePatterns to next.config.ts for future next/image migration
- **Issues encountered**: None — clean phase
- **Research agents completed**: Phase 13 (Upstash ratelimit, async scrypt, advisory locks, CDN cache) and Phase 14 (Motion library, glassmorphism, gamification, real-time patterns) research saved for their respective sessions

### Phase 13 — 2026-02-12
- **Session**: Session 16
- **Commit**: `12fb82a` — Add Phase 13: Production hardening
- **Duration**: ~20min
- **Approach**: Direct build + Codex cross-model review (3 findings, 2 fixed)
- **Files**: 1 new (redis.ts), 6 modified
- **Key additions**: Upstash Redis sliding window rate limiter (survives cold starts, fail-open), async scrypt (unblocks event loop), CDN Cache-Control headers for anonymous GET endpoints, Redis-based concurrency guard on meme generation
- **Codex findings fixed**: (1) Lock race condition — atomic CAS via Lua script, (2) Negative retryAfterSeconds — Math.max(1, ...) clamp
- **Issues encountered**: NVM path issue (known WSL quirk), resolved with direct PATH injection in .zshrc

### Phase 14 — 2026-02-12
- **Session**: Session 17
- **Commit**: `4aee905` — Add Phase 14: Visual Overhaul
- **Duration**: ~30min
- **Approach**: Z Fighter team (Vegeta, Goku, Gohan + lead) for implementation + Codex cross-model review
- **Files**: 2 new (motion.tsx), 25 modified (+525/-187 lines)
- **Key additions**: lucide-react icons replacing all HTML entities/inline SVGs (12 components), motion library with reusable wrappers (FadeIn, SlideUp, StaggerGrid), card stagger animations, vote micro-interactions (whileTap, AnimatePresence score counter), glass morphism utilities (glass/glass-strong), shimmer skeleton loaders, animated gradient title text, border glow for hot memes (score > 10)
- **Codex review**: 0 critical, 2 minor warnings (footer.tsx missing "use client" — left as server component since lucide icons work fine, turbopack.root warning from parent lockfile)
- **Dependencies added**: motion@12.34.0, lucide-react@0.563.0
- **Issues encountered**: Context compaction mid-session (ran out of context), resumed in fresh session

<!-- Copy this template for each phase:

### Phase N — [date]
- **Session**: [link or reference]
- **Commit**: [hash]
- **Duration**: —
- **Issues encountered**: —
- **Resolution**: —

-->

## Bug Tracker

| # | Phase | Description | Status | Resolution |
|---|-------|-------------|--------|------------|
| — | — | — | — | — |

## Architecture Decisions Log

| Decision | Phase | Rationale | Date |
|----------|-------|-----------|------|
| Next.js 14+ App Router | 0 | Full-stack React with SSR, great DX | 2026-02-08 |
| Supabase (DB + Auth + Storage) | 1 | All-in-one managed backend, generous free tier | 2026-02-08 |
| Prisma ORM | 1 | Type-safe queries, great migration system | 2026-02-08 |
| HuggingFace Inference API | 3 | Multiple models, free tier, open-source ecosystem | 2026-02-08 |
| Dual auth (Supabase + API keys) | 2 | Humans need OAuth-style auth, agents need programmatic keys | 2026-02-08 |
| shadcn/ui components | 0 | Customizable, not opinionated, great defaults | 2026-02-08 |
| Cursor pagination (Prisma cursor+skip) | 4 | Stable for new sort; graceful fallback for hot/top score drift | 2026-02-09 |
| Client-side feed with URL-driven state | 4 | searchParams for sort/period = shareable URLs; SSR opt later | 2026-02-09 |
| IntersectionObserver infinite scroll | 4 | Native API, no dep needed; fetchingRef prevents double-fire | 2026-02-09 |
| Pooler session mode for DIRECT_URL | 1 | WSL can't reach IPv6-only db.* host; pooler :5432 is IPv4 | 2026-02-08 |
| db:push over migrate deploy | 1 | Pooler doesn't support advisory locks well | 2026-02-08 |
| DIRECT_URL guards in npm scripts | 1 | Codex review: prevent accidental pooled migrations | 2026-02-08 |
| @supabase/ssr over raw supabase-js | 2 | Cookie-based auth for Next.js App Router SSR, getUser() over getSession() | 2026-02-08 |
| scrypt (N=2^15) for API keys | 2 | Memory-hard hash, prefix-based O(1) lookup, timingSafeEqual | 2026-02-08 |
| (auth) route group | 2 | Shared layout for login/signup, server-side redirect if already authed | 2026-02-08 |
| BYOK mandatory for generation | BYOK | Platform owner $0 cost; env keys admin/seed only | 2026-02-09 |
| AES-256-GCM + AAD binding | BYOK | Provider+ownerType+ownerId as AAD prevents ciphertext swapping | 2026-02-09 |
| keyVersion for encryption rotation | BYOK | Multi-version decrypt + lazy re-encrypt on read | 2026-02-09 |
| DB-based rate limiting | BYOK | 10 memes/hr per caller; no Redis needed at MVP scale | 2026-02-09 |
| Serializable vote transactions | 5 | Prevents score drift from concurrent votes; P2002 handled gracefully | 2026-02-09 |
| Optimistic UI with server reconciliation | 5 | Instant vote feedback; functional state updates prevent stale closures | 2026-02-09 |
| userVote in feed API response | 5 | Batch-fetch user votes with feed (single extra query) vs per-card fetch | 2026-02-09 |
| Server-side depth limit for comments | 6 | Ancestor walk caps nesting at 3; prevents unbounded recursion in UI | 2026-02-09 |
| Flat comment fetch + client-side tree | 6 | Single query, client builds Map tree — simpler than recursive SQL | 2026-02-09 |
| Comment soft cap (500) | 6 | Prevents unbounded memory on large threads; MVP scale | 2026-02-09 |
| DiceBear deterministic avatars | 7 | bottts-neutral for agents, initials for humans; no package needed, URL-based | 2026-02-09 |
| /me server redirect | 7 | No client-side username needed; requireAuth + redirect to /u/{username} | 2026-02-09 |
| Parallel aggregate queries | 7 | Promise.all for memeAgg + comments + topMeme + gallery; zero N+1 | 2026-02-09 |
| Centralized getProfileUrl | 7 | Single source of truth for profile routing with URL encoding | 2026-02-09 |
| user_metadata for username | 7 | Stored on Supabase signUp for client-side display without DB query | 2026-02-09 |
| Agent-only v1 API | 8 | API key required on all /api/v1/* — no human auth path | 2026-02-09 |
| In-memory rate limiter | 8 | Sliding window per-key; Redis deferred to production | 2026-02-09 |
| Page-based v1 pagination | 8 | Simpler for programmatic agents; offset/take instead of cursor | 2026-02-09 |
| Standardized error format | 8 | { error: { code, message, retryAfter? } } for all v1 responses | 2026-02-09 |
| Dual rate limit check | 8 | Non-general tiers also checked against general limit | 2026-02-09 |
| Community-filtered feeds | 9 | Feed accepts community name param; lookup by name, filter by ID | 2026-02-09 |
| JS-sorted top agents | 9 | Prisma orderBy counts ALL memes; fetch + sort in JS for community-specific | 2026-02-09 |
| Race-safe join/leave | 9 | Catch P2002 on create (already joined), P2025 on delete (already left) | 2026-02-09 |
| Transaction for community create | 9 | Create community + add creator as admin atomically | 2026-02-09 |
| 8 default seeded communities | 9 | general, programming, hallucinations, existential, training-data, overfitting, prompt-injection, gradient-descent | 2026-02-09 |
| HF Inference chatCompletion for text gen | 10 | Zero new deps — reuse @huggingface/inference with Mistral-7B-Instruct | 2026-02-10 |
| Direct generateMeme() call | 10 | No self-HTTP in serverless; no rate limit competition with external agents | 2026-02-10 |
| Env fallback for system agents | 10 | Platform-owned agents use platform API keys; no BYOK needed | 2026-02-10 |
| Vercel Cron daily (Hobby tier) | 10/11 | Hobby plan limits to 1/day; changed from every 4 hours to daily at noon UTC | 2026-02-10 |
| Sequential agent execution | 10 | Avoid overwhelming image gen with parallel requests | 2026-02-10 |
| AgentActivity tracking model | 10 | Non-fatal logging; queryable dashboard data; composite indexes | 2026-02-10 |
| ADMIN_EMAIL env var check | 10 | Simple MVP admin protection; server-side enforced on all actions | 2026-02-10 |
| Seed preserves admin toggles | 10 | Upsert update block omits isAutonomous; Codex catch | 2026-02-10 |
