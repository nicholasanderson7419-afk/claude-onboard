// Optional MCP servers the wizard can register with `claude mcp add`.
// Kept portable: npx-based commands only (work cross-platform via the run layer),
// no machine-specific paths. Folder-bound servers (obsidian-vault, memory, qmd)
// are handled by their own steps (06-secondbrain, 06c-qmd) since they need the
// user's vault path. These are pure tool servers with no per-user path.
export const MCP_SERVERS = [
  {
    name: 'playwright',
    scope: 'user',
    command: ['npx', '@playwright/mcp@latest'],
    available: true,
    desc: 'Browser automation — navigate, click, screenshot, test web apps.'
  },
  {
    name: 'ruflo',
    scope: 'user',
    command: ['npx', '-y', 'ruflo@latest'],
    available: true,
    desc: 'Agent orchestration, memory, and swarms.'
  },
  {
    name: 'claude-flow',
    scope: 'user',
    command: ['npx', '-y', '@claude-flow/cli@latest', 'mcp', 'start'],
    // MAX_AGENTS capped at 8 per project guidance ("6-8 for tight coordination"),
    // not 15 from Nick's personal config. env is optional tuning; the server runs without it.
    env: {
      CLAUDE_FLOW_MODE: 'v3',
      CLAUDE_FLOW_HOOKS_ENABLED: 'true',
      CLAUDE_FLOW_TOPOLOGY: 'hierarchical-mesh',
      CLAUDE_FLOW_MAX_AGENTS: '8',
      CLAUDE_FLOW_MEMORY_BACKEND: 'hybrid'
    },
    available: true,
    desc: 'Swarms, memory, agents, hive-mind (claude-flow / ruflo stack).'
  }
];
