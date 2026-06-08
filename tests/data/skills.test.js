import { describe, it, expect } from 'vitest';
import { CLONE_SKILLS, BUNDLED_SKILLS, BUNDLED_COMMANDS } from '../../src/data/skills.js';

describe('skills data', () => {
  it('llm-council is the one clone-skill with a real upstream repo', () => {
    const c = CLONE_SKILLS.find(s => s.name === 'llm-council');
    expect(c).toBeTruthy();
    expect(c.repo).toBe('https://github.com/tenfoldmarc/llm-council-skill');
  });

  it('no longer bundles the trading skills (pulled from the sold product 2026-06-08)', () => {
    expect(BUNDLED_SKILLS).toEqual([]);
    for (const t of [
      'ito-basket-compare', 'ito-data-atlas-agent', 'ito-market-intelligence', 'ito-trade-planner',
      'llm-trading-agent-security', 'prediction-market-oracle-research', 'prediction-market-risk-review'
    ]) expect(BUNDLED_SKILLS).not.toContain(t);
  });

  it('bundles 17 om-* commands and excludes om-standup (owned by the North Star step)', () => {
    expect(BUNDLED_COMMANDS).toHaveLength(17);
    expect(BUNDLED_COMMANDS.every(f => f.startsWith('om-') && f.endsWith('.md'))).toBe(true);
    expect(BUNDLED_COMMANDS).not.toContain('om-standup.md');
  });
});
