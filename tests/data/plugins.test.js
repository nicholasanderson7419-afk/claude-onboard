import { describe, it, expect } from 'vitest';
import { MARKETPLACES, CORE, OPTIONAL } from '../../src/data/plugins.js';

describe('plugin data', () => {
  it('has 6 known marketplace sources, all resolvable (no null)', () => {
    expect(MARKETPLACES['superpowers-marketplace']).toBe('obra/superpowers-marketplace');
    expect(MARKETPLACES['caveman']).toBe('JuliusBrussee/caveman');
    expect(MARKETPLACES['trailofbits']).toBe('trailofbits/skills');
    expect(MARKETPLACES['claude-plugins-official']).toBe('anthropics/claude-plugins-official');
    expect(MARKETPLACES['claude-video-vision']).toBe('https://github.com/jordanrendric/claude-video-vision.git');
    expect(MARKETPLACES['obsidian-skills']).toBe('kepano/obsidian-skills');
    expect(Object.values(MARKETPLACES).every(v => typeof v === 'string' && v.length > 0)).toBe(true);
  });

  it('core 6 are the agreed defaults', () => {
    expect(CORE.map(p => p.name).sort()).toEqual(
      ['ask-questions-if-underspecified', 'caveman', 'claude-session-driver', 'debug-buttercup', 'double-shot-latte', 'superpowers'].sort()
    );
  });

  it('ships obsidian (available) and no longer carries create-viral-content / aaaronmiller', () => {
    const obsidian = OPTIONAL.find(p => p.name === 'obsidian');
    expect(obsidian).toBeTruthy();
    expect(obsidian.available).toBe(true);
    expect(obsidian.marketplace).toBe('obsidian-skills');
    expect(OPTIONAL.find(p => p.name === 'create-viral-content')).toBeUndefined();
    expect(MARKETPLACES['aaaronmiller']).toBeUndefined();
  });

  it('every plugin references a known, resolvable marketplace', () => {
    for (const p of [...CORE, ...OPTIONAL]) {
      expect(MARKETPLACES[p.marketplace], `${p.name} -> ${p.marketplace}`).toBeTruthy();
    }
  });
});
