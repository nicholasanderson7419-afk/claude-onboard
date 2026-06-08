import { describe, it, expect } from 'vitest';
import { MCP_SERVERS } from '../../src/data/mcp.js';

const byName = (n) => MCP_SERVERS.find(s => s.name === n);

describe('mcp server data', () => {
  it('ships playwright, ruflo, claude-flow (all available)', () => {
    expect(MCP_SERVERS.map(s => s.name).sort()).toEqual(['claude-flow', 'playwright', 'ruflo']);
    expect(MCP_SERVERS.every(s => s.available)).toBe(true);
  });

  it('all commands are npx-based and portable (no absolute machine paths)', () => {
    for (const s of MCP_SERVERS) {
      expect(Array.isArray(s.command)).toBe(true);
      expect(s.command[0]).toBe('npx');
      expect(s.command.join(' ')).not.toMatch(/[A-Za-z]:\\|\/Users\//);
    }
  });

  it('claude-flow carries env tuning with MAX_AGENTS capped at 8', () => {
    const cf = byName('claude-flow');
    expect(cf.env.CLAUDE_FLOW_MODE).toBe('v3');
    expect(cf.env.CLAUDE_FLOW_MAX_AGENTS).toBe('8');
  });

  it('does NOT ship the dropped / non-portable servers', () => {
    for (const n of ['client-vault', 'ollama', 'mirofish', 'obsidian-vault']) {
      expect(byName(n), n).toBeUndefined();
    }
  });
});
