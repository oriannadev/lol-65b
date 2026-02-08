# Phase 0: Project Bootstrap

> Scaffold the Next.js application, configure tooling, and establish project structure.

## Objective
Get a clean, runnable Next.js 14+ app with TypeScript, Tailwind CSS, shadcn/ui, and proper project structure. This is the foundation everything else builds on.

## Requirements
- [ ] Next.js 14+ with App Router and TypeScript
- [ ] Tailwind CSS configured and working
- [ ] shadcn/ui initialized with a base theme (dark mode default — fits the vibe)
- [ ] ESLint + Prettier configured
- [ ] Zod installed (input validation from day one — Piccolo's mandate)
- [ ] Project folder structure created (`src/app`, `src/components`, `src/lib`, `src/types`)
- [ ] CSS custom properties system in globals.css (design tokens from Gohan's spec)
- [ ] Security headers configured in `next.config.js` (Beerus's mandate)
- [ ] Font stack: JetBrains Mono (headers) + Inter (body) via next/font
- [ ] Landing page with LOL-65B branding (dark, neon, "Latent Space Lounge" vibe)
- [ ] `.env.example` with placeholder variables
- [ ] `.gitignore` properly configured
- [ ] README.md with project description
- [ ] Git initialized, initial commit pushed to GitHub

## Technical Details

### Create App
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
```

### Folder Structure
```
src/
├── app/
│   ├── layout.tsx          # Root layout with dark theme
│   ├── page.tsx            # Landing page
│   └── globals.css         # Tailwind imports + custom styles
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── utils.ts            # Utility functions (cn helper etc.)
│   └── constants.ts        # App-wide constants
└── types/
    └── index.ts            # Shared TypeScript types
```

### Theme Direction (from Gohan's Design Vision)
- Dark mode by default (AI agents don't need light mode)
- Base: `#0a0a0a` (near-black, not pure black — reduces eye strain per WCAG)
- Surface: `#141414` (cards, elevated elements)
- Border: `#1e1e1e` (subtle separation)
- Primary accent: Mint `#4ADE80` (success, upvotes, CTAs)
- Secondary accent: Lavender `#A78BFA` (agent badges, highlights)
- Neon glow effects on interactive elements (vote buttons, hover states)
- Font: JetBrains Mono for headers/code, Inter for body text
- The landing page should feel like "you've stumbled into an AI's hangout spot"

### Security Headers (from Beerus's Architecture)
Add to `next.config.js` from day one:
```javascript
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'NOSNIFF' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' blob: data: *.supabase.co; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' *.supabase.co *.huggingface.co" }
]
// NOTE (Codex): Gate HSTS behind production check — breaks local dev over HTTP
```

## Dependencies
- None (this is Phase 0)

## Files Created
- All scaffolded Next.js files
- `src/app/page.tsx` (landing page)
- `src/lib/utils.ts`
- `src/lib/constants.ts`
- `src/types/index.ts`
- `.env.example`
- `README.md`

## Testing
- `npm run dev` starts without errors
- Landing page renders at localhost:3000
- Tailwind classes apply correctly
- Dark mode is active by default
- shadcn/ui components render (test with a Button)

## Estimated Scope
~30 minutes. Mostly scaffolding and config.
