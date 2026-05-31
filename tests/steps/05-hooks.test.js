import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import step from '../../src/steps/05-hooks.js';

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'co-h-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('step 05 hooks', () => {
  it('writes a SessionStart hook into settings.json, preserving existing keys', async () => {
    const gdir = join(dir, '.claude'); mkdirSync(gdir, { recursive: true });
    writeFileSync(join(gdir, 'settings.json'), JSON.stringify({ model: 'opus' }));
    const ctx = { env: { home: dir, os: 'linux', stamp: 'S1' }, answers: { enableHooks: true }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    const s = JSON.parse(readFileSync(join(gdir, 'settings.json'), 'utf8'));
    expect(s.model).toBe('opus');
    expect(s.hooks.SessionStart).toHaveLength(1);
  });

  it('is idempotent — second run does not duplicate the hook', async () => {
    const ctx = { env: { home: dir, os: 'linux', stamp: 'S1' }, answers: { enableHooks: true }, results: {} };
    await step.apply(ctx);
    await step.apply(ctx);
    const s = JSON.parse(readFileSync(join(dir, '.claude', 'settings.json'), 'utf8'));
    expect(s.hooks.SessionStart).toHaveLength(1);
  });
});
