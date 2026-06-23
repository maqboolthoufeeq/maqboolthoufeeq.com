'use client'

import { Agentation } from 'agentation'

/**
 * Development-only annotation toolbar. Agentation lets you annotate the running
 * app in the browser so AI coding agents can read those notes through the local
 * `agentation-mcp` server (default endpoint http://localhost:4747).
 *
 * This is gated behind `NODE_ENV === 'development'` in app/layout.tsx, so it is
 * never rendered (or run) in production. The package is a devDependency.
 */
export default function AgentationDev() {
  return <Agentation endpoint="http://localhost:4747" />
}
