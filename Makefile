.PHONY: help dev build start install clean \
        lint lint-fix type-check test test-watch audit \
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
	@echo "    make audit        Full npm vulnerability report"
	@echo "    make pr           Audit-fix + format + lint + type-check + tests (quiet; details on failure)"
	@echo ""
	@echo "  Database"
	@echo "    make db-push      Sync Prisma schema → database"
	@echo "    make db-studio    Open Prisma Studio (localhost:5555)"
	@echo "    make db-generate  Regenerate Prisma client"
	@echo ""
	@echo "  Git"
	@echo "    make br           Create a new feature branch  (prompts for name)"
	@echo ""
	@echo "  claude"
	@echo "    make claude       AI assistant for code completion and more"
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

# Quiet pipeline: one line per step. A passing step prints "ok"; a failing step
# prints "FAILED" followed by its full output, then aborts. Run `make audit` or
# `make lint` for full detail. (npm audit fix never uses --force: it would
# downgrade Next/postcss/Prisma and break the app.)
pr:
	@printf '→ %-26s ' 'security audit (auto-fix)'; npm audit fix >/dev/null 2>&1 || true; echo 'ok'
	@printf '→ %-26s ' 'format'; if out=$$(npx eslint . --fix 2>&1); then echo 'ok'; else echo 'FAILED'; printf '\n%s\n' "$$out"; exit 1; fi
	@printf '→ %-26s ' 'lint'; if out=$$(npx eslint . 2>&1); then echo 'ok'; else echo 'FAILED'; printf '\n%s\n' "$$out"; exit 1; fi
	@printf '→ %-26s ' 'type check'; if out=$$(npx tsc --noEmit 2>&1); then echo 'ok'; else echo 'FAILED'; printf '\n%s\n' "$$out"; exit 1; fi
	@printf '→ %-26s ' 'tests'; if out=$$(npm run test:ci 2>&1); then echo 'ok'; else echo 'FAILED'; printf '\n%s\n' "$$out"; exit 1; fi
	@printf '→ %-26s ' 'security audit'; summary=$$(npm audit 2>&1 | grep -iE 'vulnerabilit' | head -1); echo "$${summary:-no known vulnerabilities}"
	@echo '✓ all checks passed'

# Full vulnerability report (the detailed output suppressed by `make pr`).
audit:
	@npm audit

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

claude: ## Run Claude Code with permission prompts skipped
	@claude --dangerously-skip-permissions

