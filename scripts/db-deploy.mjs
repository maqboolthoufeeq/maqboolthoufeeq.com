#!/usr/bin/env node
/**
 * Resilient Prisma schema sync for Vercel builds.
 *
 * Why this exists: the build previously ran `prisma db push` inline in
 * vercel.json's buildCommand. A single transient database hiccup — a Neon
 * compute cold-start after auto-suspend, or a network blip between the build
 * region and the DB region — returns `P1001: Can't reach database server` and
 * fails the ENTIRE deploy, even for frontend-only changes.
 *
 * This script hardens that step:
 *   - uses a DIRECT (non-pooled) connection for the DDL push, per Neon/Prisma
 *     guidance (migrations should not go through the PgBouncer "-pooler" host);
 *   - raises connect_timeout so a cold compute has time to wake before P1001;
 *   - retries with backoff before giving up.
 *
 * It runs the push only on the deploy branches (main/dev); on any other ref it
 * is a no-op, exactly mirroring the previous buildCommand behaviour.
 */

import { spawnSync } from 'node:child_process';

const DEPLOY_BRANCHES = new Set(['main', 'dev']);
const MAX_ATTEMPTS = 3;
const CONNECT_TIMEOUT_SECONDS = 20;

const ref = process.env.VERCEL_GIT_COMMIT_REF ?? '';

if (!DEPLOY_BRANCHES.has(ref)) {
  console.log(`[db-deploy] ref "${ref || '(none)'}" is not a deploy branch — skipping schema sync.`);
  process.exit(0);
}

const raw = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!raw) {
  console.error('[db-deploy] DATABASE_URL is not set — cannot sync schema.');
  process.exit(1);
}

/**
 * Build a direct, generously-timed connection URL for the DDL push.
 * Falls back to the input unchanged if it is not a parseable URL.
 */
function toDirectUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    return input;
  }
  // Neon's pooled endpoint is "<id>-pooler.<...>"; the direct one drops "-pooler".
  // No-op for non-Neon hosts, so this stays safe if the provider ever changes.
  url.hostname = url.hostname.replace('-pooler.', '.');
  if (!url.searchParams.has('connect_timeout')) {
    url.searchParams.set('connect_timeout', String(CONNECT_TIMEOUT_SECONDS));
  }
  return url.toString();
}

/** Portable blocking sleep (Vercel builds are Linux, but this avoids a `sleep` dep). */
function sleepSync(seconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, seconds * 1000);
}

const databaseUrl = toDirectUrl(raw);

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  console.log(`[db-deploy] prisma db push (attempt ${attempt}/${MAX_ATTEMPTS})…`);
  const result = spawnSync('npx', ['prisma', 'db', 'push'], {
    stdio: 'inherit',
    // Override only this subprocess's DATABASE_URL (read by prisma.config.ts);
    // the deployed app keeps using the pooled connection from its own env.
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  if (result.status === 0) {
    console.log('[db-deploy] schema in sync.');
    process.exit(0);
  }

  if (attempt < MAX_ATTEMPTS) {
    const backoff = attempt * 5; // 5s, then 10s
    console.warn(`[db-deploy] push failed (exit ${result.status ?? 'signal'}). Retrying in ${backoff}s…`);
    sleepSync(backoff);
  }
}

console.error(`[db-deploy] schema sync failed after ${MAX_ATTEMPTS} attempts.`);
process.exit(1);
