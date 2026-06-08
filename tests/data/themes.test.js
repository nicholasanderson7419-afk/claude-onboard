import { describe, it, expect } from 'vitest';
import { THEMES, DEFAULT_THEME, appearanceFor } from '../../src/data/themes.js';

describe('obsidian theme picker', () => {
  it('default theme -> dark base + exactly one snippet', () => {
    const a = appearanceFor(DEFAULT_THEME);
    expect(a.theme).toBe('obsidian');
    expect(a.enabledCssSnippets).toHaveLength(1);
  });

  it('light theme uses the moonstone (light) base', () => {
    expect(appearanceFor('light').theme).toBe('moonstone');
  });

  it('unknown value falls back to default', () => {
    expect(appearanceFor('nonsense')).toEqual(appearanceFor(DEFAULT_THEME));
  });

  it('all themes have unique snippet names and a valid base mode', () => {
    const snippets = THEMES.map(t => t.snippet);
    expect(new Set(snippets).size).toBe(snippets.length);
    for (const t of THEMES) expect(['obsidian', 'moonstone']).toContain(t.mode);
  });
});
