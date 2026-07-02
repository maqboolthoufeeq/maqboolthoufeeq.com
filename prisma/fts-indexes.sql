-- Expression GIN indexes backing lib/search.ts (searchFTS). Prisma's schema
-- language cannot declare expression indexes, so these live here and are
-- applied by scripts/db-deploy.mjs right after `prisma db push` (which may
-- drop indexes it does not know about — re-applying is idempotent and cheap
-- at this data size).
--
-- IMPORTANT: each expression must stay byte-for-byte identical to the
-- to_tsvector(...) expression used in the corresponding query in
-- lib/search.ts, or the planner will not use the index.
--
-- "Project" has no index: its query folds in array_to_string(tech, ' '),
-- which Postgres marks STABLE (not IMMUTABLE), so it cannot be indexed
-- directly. The table is a handful of rows — a seq scan is fine.

CREATE INDEX IF NOT EXISTS "Post_fts_idx" ON "Post" USING GIN (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,''))
);

CREATE INDEX IF NOT EXISTS "HubTopic_fts_idx" ON "HubTopic" USING GIN (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
);

CREATE INDEX IF NOT EXISTS "HubItem_fts_idx" ON "HubItem" USING GIN (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(content,''))
);

CREATE INDEX IF NOT EXISTS "MediaItem_fts_idx" ON "MediaItem" USING GIN (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
);
