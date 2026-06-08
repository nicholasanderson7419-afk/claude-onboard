import { describe, it, expect } from 'vitest';
import { GOALS, pluginsForGoals } from '../../src/data/goals.js';
import { CORE, OPTIONAL } from '../../src/data/plugins.js';

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
