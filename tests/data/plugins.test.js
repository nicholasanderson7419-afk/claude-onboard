import { describe, it, expect } from 'vitest';
import { MARKETPLACES, CORE, OPTIONAL } from '../../src/data/plugins.js';

describe('plugin data', () => {
  it('has 5 known marketplace sources (+ aaaronmiller flagged unknown)', () => {
    expect(MARKETPLACES['superpowers-marketplace']).toBe('obra/superpowers-marketplace');
    expect(MARKETPLACES['caveman']).toBe('JuliusBrussee/caveman');
    expect(MARKETPLACES['trailofbits']).toBe('trailofbits/skills');
    expect(MARKETPLACES['claude-plugins-official']).toBe('anthropics/claude-plugins-official');
    expect(MARKETPLACES['claude-video-vision']).toBe('https://github.com/jordanrendric/claude-video-vision.git');
    expect(MARKETPLACES['aaaronmiller']).toBe(null);
  });

  it('core 6 are the agreed defaults', () => {
    expect(CORE.map(p => p.name).sort()).toEqual(
      ['ask-questions-if-underspecified', 'caveman', 'claude-session-driver', 'debug-buttercup', 'double-shot-latte', 'superpowers'].sort()
    );
  });

  it('optional set excludes create-viral-content until aaaronmiller source is known', () => {
    const cvc = OPTIONAL.find(p => p.name === 'create-viral-content');
    expect(cvc.available).toBe(false);
  });
});
