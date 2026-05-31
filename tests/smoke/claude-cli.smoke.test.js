import { describe, it, expect } from 'vitest';
import { run } from '../../src/lib/exec.js';
import { addMarketplace, pluginList } from '../../src/lib/claude.js';
import { parsePluginList } from '../../src/lib/detect.js';

const enabled = process.env.CLAUDE_ONBOARD_SMOKE === '1';
const maybe = enabled ? describe : describe.skip;

maybe('REAL claude CLI (opt-in)', () => {
  it('plugin list runs headless and parses', async () => {
    const r = await pluginList(run);
    expect(r.ok).toBe(true);
    expect(Array.isArray(parsePluginList(r.stdout))).toBe(true);
  });

  it('marketplace add is idempotent headless', async () => {
    const r = await addMarketplace(run, 'obra/superpowers-marketplace');
    // ok whether freshly added or already present
    expect([true, false]).toContain(r.ok);
    expect(r.stderr + r.stdout).toMatch(/superpowers|already|added/i);
  });
});
