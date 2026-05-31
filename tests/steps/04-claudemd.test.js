import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import step from '../../src/steps/04-claudemd.js';

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'co-cm-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('step 04 claudemd', () => {
  it('writes global with plugin rules and project file in chosen dir', async () => {
    const ctx = {
      env: { home: dir, stamp: 'S1' },
      answers: {
        projectDir: join(dir, 'proj'),
        projectName: 'My App', projectDesc: 'a test', conventions: 'use TDD',
        plugins: [{ name: 'caveman' }]
      },
      results: {}
    };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    const global = readFileSync(join(dir, '.claude', 'CLAUDE.md'), 'utf8');
    expect(global).toContain('onboard:global:start');
    expect(global).toContain('caveman');               // plugin rule injected
    const proj = readFileSync(join(dir, 'proj', 'CLAUDE.md'), 'utf8');
    expect(proj).toContain('My App');
  });

  it('backs up an existing global CLAUDE.md before modifying', async () => {
    const gdir = join(dir, '.claude');
    writeFileSync(join(dir, 'pre.txt'), 'x'); // ensure dir helper runs
    const ctx = { env: { home: dir, stamp: 'S2' }, answers: { projectDir: join(dir, 'p'), projectName: 'P', projectDesc: 'd', conventions: 'c', plugins: [] }, results: {} };
    await step.apply(ctx);                       // creates global
    await step.apply(ctx);                       // second run should back up
    expect(existsSync(join(gdir, 'CLAUDE.md.bak.S2'))).toBe(true);
  });
});
