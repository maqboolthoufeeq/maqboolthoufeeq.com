export type ToolContent = { type: 'text'; text: string }

export type ToolDef = {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface ToolModule {
  TOOLS: ToolDef[]
  handle(name: string, args: Record<string, unknown>): Promise<ToolContent[]>
}

export function text(value: unknown): ToolContent[] {
  return [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }]
}
