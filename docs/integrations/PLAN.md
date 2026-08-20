# Integrations & one-click cross-publishing

**Branch:** `integrations` (from `dev`)
**Goal:** An admin **Integrations** section where the owner connects social/blog/community
platforms, plus a **Publish everywhere** button on blog posts and hub items that
cross-posts in one click — using **only official, ToS-compliant APIs** so no account is
ever banned.

## Owner decisions / assumptions (no user available to confirm)

1. **Branch name** — user wrote `'inegrations'`; treated as a typo for **`integrations`**
   (obvious intent; a misspelled branch is not what's wanted). Single feature branch as
   the user explicitly asked for one branch ("create a branch … to work on this"), not the
   skill's default stacked chain.
2. **Ban-safety is the hard constraint.** Most of the requested platforms have **no
   official API for posting blog content**, or one that bans accounts when misused
   (Instagram, TikTok, Substack). The honest, correct design classifies every platform by
   capability and **never auto-posts to a platform without a safe official API**:
   - `autoPublish` — full article via official API (dev.to, Hashnode, Medium).
   - `announce` — short post + canonical link via official API (X, LinkedIn, Mastodon,
     Bluesky, Telegram, Discord, Slack, Reddit, Facebook Page).
   - `linkOnly` — **no safe posting API → store a profile link, never auto-post**
     (Instagram, Instagram Reels, TikTok, YouTube, YouTube Shorts, Twitch, Vimeo,
     Substack, Quora, Answer Overflow, G2, GitHub). Documented why, in-product.
3. **Credentials need reversible encryption.** Unlike the OAuth bearer tokens (SHA-256
   *hashed*, verify-only), outbound API credentials must be **sent** to third parties, so
   they're stored with **AES-256-GCM** at rest. Key = `INTEGRATIONS_ENC_KEY` (base64, 32
   bytes) if set, else derived from `AUTH_SECRET` via scrypt — works out-of-the-box in dev.
   Plaintext secrets are **never** returned to the client (only masked `••••1234` hints).
4. **Canonical URL** is set on every blog cross-post (dev.to `canonical_url`, Hashnode
   `originalArticleURL`, Medium `canonicalUrl`) → original site keeps SEO authority.
5. **Blog content is HTML** (TipTap, sanitized). Added a focused, unit-tested
   **HTML→Markdown** converter (no new dependency) for markdown platforms; Medium gets HTML.
6. **Reliability** — publishing fans out with `Promise.allSettled`; one platform failing
   never blocks others; every attempt is recorded in `PublishRecord` (success+URL / error).

## Working conventions (match existing code)

- Next.js 16 App Router, Prisma 7, NextAuth 5. API routes guard with `auth()` /
  `isAuthenticated(req)`. Owner-only mutations.
- Files < 500 lines. One provider per file. Design tokens `var(--accent)` etc.
  lucide-react icons. Tailwind 4. Comments explain *why*.
- Gate: **`make pr`** (audit-fix → eslint --fix → eslint → tsc → jest). Must pass before push.
- Tests: jest, `jest.mock('@/lib/prisma')`, node env. Mock `fetch` for providers.

## Architecture

```
prisma/schema.prisma        + Integration, PublishRecord
lib/integrations/
  types.ts          provider interface, capability enums, PublishInput/Result
  crypto.ts         AES-256-GCM encrypt/decrypt of credentials at rest
  html-to-markdown.ts  TipTap HTML → Markdown (tested)
  store.ts          DB access: get/list(masked)/upsert/delete, encryption wiring
  registry.ts       all providers; getProvider/listProviders
  publish.ts        orchestrator: fan out → allSettled → record → results
  providers/<id>.ts one file each
app/api/integrations/
  route.ts          GET list (masked) / PUT upsert
  [provider]/route.ts        GET one / DELETE
  [provider]/test/route.ts   POST test connection
  publish/route.ts           POST cross-post a post/hub item
app/admin/(protected)/integrations/page.tsx   + IntegrationsPanel client
components/admin/IntegrationsPanel.tsx, ProviderConnectModal, CrossPostModal
components/blog + hub: "Publish everywhere" button entry points
```

## Branch-chain / task table

| # | Task | Status |
|---|------|--------|
| 1 | PLAN + Prisma models (Integration, PublishRecord) + db push | ✅ done |
| 2 | Secure core: crypto, types, store, registry, html→md, publish orchestrator | ✅ done |
| 3 | Providers (auto/announce + link-only), from verified API specs | ✅ done |
| 4 | Admin Integrations UI + API routes (connect, test, enable, mask) | ✅ done |
| 5 | Publish-everywhere button on blog + hub + /api/integrations/publish | ✅ done |
| 6 | Tests, `make pr` gate, browser verify, push + PR | ✅ done |

## Verification plan

- Unit: crypto round-trip + tamper-detect; html→md cases; orchestrator with mocked fetch
  (success/partial/all-fail); webhook/URL SSRF validation; provider payload builders.
- Gate: `make pr` green before every push.
- Browser: log into `/admin/integrations` (dev OTP `123456`), connect a webhook provider,
  run a cross-post against a mock, screenshot. If local DB/dev unavailable → document as
  deferred with reason (honesty rule), keep unit coverage.

## Verified vs deferred (honesty)

- **Verified in browser (Playwright, dev server):** admin `/integrations` renders all
  providers grouped by category with correct capability badges + ban-safety copy; the
  Discord connect modal shows setup docs + form; saving a webhook persists it
  **AES-GCM-encrypted (confirmed `v1:…` ciphertext, no plaintext in DB)** with a masked
  `••••…` hint; the enable toggle works; the "Publish everywhere" button on a blog post
  opens the cross-post modal and lists the connected+enabled Discord target pre-checked.
  No console errors. Test data + the temporary preauth token were cleaned up afterwards.
- **Verified by unit tests (47):** crypto round-trip + tamper/fail-closed; HTML→Markdown
  cases; SSRF guards (http/private-IP/metadata rejection); provider payload builders
  (dev.to body + canonical_url, Telegram, Discord); publish orchestrator (partial
  failure isolation, token-rotation persistence, providerIds filter); registry invariants
  (link-only never auto-posts).
- **Deferred (cannot test without live keys):** the actual outbound POST to each real
  third-party API. The request contracts were verified against official docs (research
  workflow, 2026-06-24, high confidence) and exercised with mocked fetch; the real round
  trip happens the first time the owner connects a real account and clicks publish.
- **Provider notes:** Medium is link-only (its API was archived 2023). Hashnode requires
  a Pro plan for API access (since 2026-05). X free tier is pay-per-use (since 2026-02).
  LinkedIn/Facebook/Reddit need platform app review / pre-approval for production.

## Change log

- Branch `integrations` created from `dev`.
- Research workflow (14 agents) verified each platform's official API contract +
  ban-safety; results in `API_REFERENCE.md`.
- Commit 1: Prisma models + secure core (crypto, types, http/SSRF, html→md, store,
  registry, publish orchestrator) + all providers.
- Commit 2: admin Integrations UI + API routes + publish-everywhere button (blog post
  page, posts table, hub item editor) + dashboard/nav entries + 47 unit tests.
- Gate `make pr` green (lint, type-check, tests). `next build` compiles all 5 routes.
- Browser-verified the full connect → encrypt → enable → cross-post flow; cleaned up.
- Pushed `integrations` → origin. `gh` CLI not authenticated here, so open the PR via:
  **https://github.com/maqboolthoufeeq/maqboolthoufeeq.com/pull/new/integrations**
  (base `dev`). After connecting real accounts, run `npx prisma db push` on prod so the
  `Integration` + `PublishRecord` tables exist (already pushed to the dev/Neon DB).
