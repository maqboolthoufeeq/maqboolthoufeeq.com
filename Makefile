.PHONY: help dev build start install clean \
        lint lint-fix type-check test test-watch \
        db-push db-studio db-generate \
        pr br

# ── default ───────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  Dev"
	@echo "    make dev          Start dev server (localhost:3000)"
	@echo "    make build        Production build"
	@echo "    make start        Run production build locally"
	@echo "    make install      npm install"
	@echo "    make clean        Delete .next build cache"
	@echo ""
	@echo "  Quality"
	@echo "    make lint         ESLint check"
	@echo "    make lint-fix     ESLint auto-fix"
	@echo "    make type-check   TypeScript check"
	@echo "    make test         Run tests"
	@echo "    make test-watch   Run tests in watch mode"
	@echo "    make pr           Format + lint + type-check + tests (full pre-commit)"
	@echo ""
	@echo "  Database"
	@echo "    make db-push      Sync Prisma schema → database"
	@echo "    make db-studio    Open Prisma Studio (localhost:5555)"
	@echo "    make db-generate  Regenerate Prisma client"
	@echo ""
	@echo "  Git"
	@echo "    make br           Create a new feature branch  (prompts for name)"
	@echo ""

# ── dev ───────────────────────────────────────────────────────────────────────
dev:
	npm run dev

build:
	npm run build

start:
	npm run start

install:
	npm install

clean:
	rm -rf .next

# ── quality ───────────────────────────────────────────────────────────────────
lint:
	npx eslint .

lint-fix:
	npx eslint . --fix

type-check:
	npx tsc --noEmit

test:
	npm test

test-watch:
	npm run test:watch

pr:
	@echo "→ format..."
	@npx eslint . --fix || (echo "✗ format failed — unfixable lint errors" && exit 1)
	@echo "→ lint..."
	@npx eslint . || (echo "✗ lint failed" && exit 1)
	@echo "→ type check..."
	@npx tsc --noEmit || (echo "✗ type check failed" && exit 1)
	@echo "→ tests..."
	@npm run test:ci || (echo "✗ tests failed" && exit 1)
	@echo "✓ all checks passed"

# ── database ──────────────────────────────────────────────────────────────────
db-push:
	npx prisma db push

db-studio:
	npx prisma studio

db-generate:
	npx prisma generate

# ── git ───────────────────────────────────────────────────────────────────────
br:
	@if [ -n "$(filter-out $@,$(MAKECMDGOALS))" ]; then \
		git checkout -b $(filter-out $@,$(MAKECMDGOALS)); \
	else \
		read -p "Branch name (e.g. feat/my-feature): " name; \
		git checkout -b $$name; \
	fi

%:
	@:
