import { describe, it, expect } from 'vitest';
import { run } from '../../src/lib/exec.js';
import { pluginList, mcpList } from '../../src/lib/claude.js';
import { parsePluginList, parseMcpList } from '../../src/lib/detect.js';

// Opt-in only (CLAUDE_ONBOARD_SMOKE=1). Fully READ-ONLY — these commands do not
// install plugins, add marketplaces, change settings.json/CLAUDE.md, or modify
// MCP servers. They only read existing state. Validates that the real `claude`
// CLI is reachable headless and its output parses with our parsers.
const enabled = process.env.CLAUDE_ONBOARD_SMOKE === '1';
const maybe = enabled ? describe : describe.skip;

maybe('REAL claude CLI (read-only, opt-in)', () => {
  it('plugin list runs headless and parses', async () => {
    const r = await pluginList(run);
    expect(r.ok).toBe(true);
    expect(Array.isArray(parsePluginList(r.stdout))).toBe(true);
  });

  it('mcp list runs headless and parses', async () => {
    const r = await mcpList(run);
    expect(r.ok).toBe(true);
    expect(Array.isArray(parseMcpList(r.stdout))).toBe(true);
  }, 60000); // `claude mcp list` health-checks every MCP server; can take >5s on loaded setups

  it('marketplace list runs headless (read-only, no writes)', async () => {
    const r = await run('claude', ['plugin', 'marketplace', 'list']);
    expect(r.ok).toBe(true);
  });
});
