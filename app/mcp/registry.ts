/**
 * Tool registry — import a module here to make its tools available via /mcp.
 * Each module exports TOOLS (definitions) and handle(name, args) (executor).
 * Adding a new feature area = creating a new tools/*.ts file + one line here.
 */

import type { ToolContent, ToolModule } from './types'
import * as posts      from './tools/posts'
import * as projects   from './tools/projects'
import * as site       from './tools/site'
import * as appearance from './tools/appearance'
import * as tags       from './tools/tags'
import * as media      from './tools/media'

const MODULES: ToolModule[] = [posts, projects, site, appearance, tags, media]

export const ALL_TOOLS = MODULES.flatMap((m) => m.TOOLS)

export async function callTool(
  name: string,
  args: Record<string, unknown>,
): Promise<ToolContent[]> {
  for (const mod of MODULES) {
    if (mod.TOOLS.some((t) => t.name === name)) {
      return mod.handle(name, args)
    }
  }
  throw new Error(`Unknown tool: ${name}`)
}
