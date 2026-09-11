# Rakt Kavach

Rakt Kavach is a bilingual dark-mode PWA for India's national blood grid, giving donors a secure mobile identity, digital donor card, QR pass, blood credit wallet, and donation history.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/rakt-kavach/src/App.tsx` — the authenticated donor wallet, onboarding, OTP demo flow, and local profile state.
- `artifacts/rakt-kavach/src/index.css` — the Rakt Kavach dark neon grid theme, typography, motion, and responsive foundations.
- `artifacts/rakt-kavach/public/manifest.webmanifest` — install metadata for the PWA.
- `artifacts/rakt-kavach/public/sw.js` — lightweight offline shell caching.

## Architecture decisions

- The first build is frontend-only so the complete donor journey can be explored without provisioning a backend or external auth provider.
- A demo OTP flow is used for the prototype; donor profile, biometric preference, language, and donation updates persist in local storage.
- The app is route-aware with a public onboarding/auth route and a protected `/home` wallet route, while the installed PWA starts at `/`.

## Product

- Splash and three-step onboarding in English and Hindi.
- Mobile number + demo OTP verification, biometric unlock toggle, and generated `RKT-XXXX-XXXX` donor IDs.
- Digital donor card with blood group, reward tier, live QR pass, blood credits, eligibility date, profile editing, and donation logging.

## User preferences

_No durable preferences recorded._

## Gotchas

- The PWA service worker is progressive enhancement; the app remains usable if registration is unavailable.
- The demo OTP button fills `2468`; this is intentionally not real authentication.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
