import { describe, it, expect } from 'vitest';
import { GOALS, pluginsForGoals, mcpForGoals, skillsForGoals } from '../../src/data/goals.js';
import { CORE, OPTIONAL } from '../../src/data/plugins.js';
import { MCP_SERVERS } from '../../src/data/mcp.js';

describe('goals -> plugins concierge mapping', () => {
  it('always includes the full CORE set', () => {
    const got = pluginsForGoals(['explore'], CORE, OPTIONAL).map(p => p.name);
    for (const c of CORE) expect(got).toContain(c.name);
  });

  it('"build" adds gh-cli + code-review', () => {
    const got = pluginsForGoals(['build'], CORE, OPTIONAL).map(p => p.name);
    expect(got).toContain('gh-cli');
    expect(got).toContain('code-review');
  });

  it('"write" adds obsidian + elements-of-style + private-journal-mcp', () => {
    const got = pluginsForGoals(['write'], CORE, OPTIONAL).map(p => p.name);
    expect(got).toContain('obsidian');
    expect(got).toContain('elements-of-style');
    expect(got).toContain('private-journal-mcp');
  });

  it('"explore" is core-only (no extras)', () => {
    expect(pluginsForGoals(['explore'], CORE, OPTIONAL).length).toBe(CORE.length);
  });

  it('unions extras across multiple goals with no duplicates', () => {
    const got = pluginsForGoals(['build', 'write'], CORE, OPTIONAL).map(p => p.name);
    expect(got).toContain('gh-cli');
    expect(got).toContain('obsidian');
    expect(new Set(got).size).toBe(got.length);
  });

  it('every goal extra maps to a real available OPTIONAL plugin', () => {
    const optNames = new Set(OPTIONAL.filter(p => p.available).map(p => p.name));
    for (const g of GOALS) for (const e of g.extras) expect(optNames.has(e), `${g.value} -> ${e}`).toBe(true);
  });
});

describe('goals -> MCP + skills concierge mapping', () => {
  it('"build" implies the playwright MCP server', () => {
    const got = mcpForGoals(['build'], MCP_SERVERS).map(s => s.name);
    expect(got).toContain('playwright');
  });

  it('"automate" implies the ruflo + claude-flow MCP servers', () => {
    const got = mcpForGoals(['automate'], MCP_SERVERS).map(s => s.name);
    expect(got).toContain('ruflo');
    expect(got).toContain('claude-flow');
  });

  it('"write" implies no MCP servers', () => {
    expect(mcpForGoals(['write'], MCP_SERVERS)).toEqual([]);
  });

  it('"explore" implies no MCP and no skills', () => {
    expect(mcpForGoals(['explore'], MCP_SERVERS)).toEqual([]);
    expect(skillsForGoals(['explore']).size).toBe(0);
  });

  it('"write" implies the om-commands suite + llm-council', () => {
    const set = skillsForGoals(['write']);
    expect(set.has('om-commands')).toBe(true);
    expect(set.has('llm-council')).toBe(true);
  });

  it('"build" implies llm-council but NOT om-commands', () => {
    const set = skillsForGoals(['build']);
    expect(set.has('llm-council')).toBe(true);
    expect(set.has('om-commands')).toBe(false);
  });

  it('unions mcp across goals with no duplicates', () => {
    const got = mcpForGoals(['build', 'automate'], MCP_SERVERS).map(s => s.name);
    expect(got).toContain('playwright');
    expect(got).toContain('claude-flow');
    expect(new Set(got).size).toBe(got.length);
  });

  it('every goal mcp maps to a real available MCP server', () => {
    const names = new Set(MCP_SERVERS.filter(s => s.available).map(s => s.name));
    for (const g of GOALS) for (const m of (g.mcp || [])) expect(names.has(m), `${g.value} -> ${m}`).toBe(true);
  });

  it('skill tokens are limited to the known set', () => {
    const known = new Set(['llm-council', 'om-commands']);
    for (const g of GOALS) for (const s of (g.skills || [])) expect(known.has(s), `${g.value} -> ${s}`).toBe(true);
  });
});
