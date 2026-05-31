import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import step from '../../src/steps/06b-northstar.js';

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'co-ns-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('step 06b northstar', () => {
  it('writes brain/North Star.md from interview answers with frontmatter and content', async () => {
    const vault = join(dir, 'vault');
    const proj = join(dir, 'proj');
    const ctx = {
      env: { stamp: 'S1', today: '2026-05-31' },
      answers: {
        vaultPath: vault, projectDir: proj,
        nsFocus: 'Ship the wizard', nsShort: '- launch v1', nsMedium: '- 100 users', nsLong: '- sustainable income'
      },
      results: {}
    };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    const ns = readFileSync(join(vault, 'brain', 'North Star.md'), 'utf8');
    expect(ns).toContain('tags:');
    expect(ns).toContain('north-star');
    expect(ns).toContain('2026-05-31');
    expect(ns).toContain('Ship the wizard');
    expect(ns).toContain('- launch v1');
  });

  it('installs the om-standup command in the project .claude/commands dir', async () => {
    const vault = join(dir, 'vault');
    const proj = join(dir, 'proj');
    const ctx = { env: { stamp: 'S1', today: '2026-05-31' }, answers: { vaultPath: vault, projectDir: proj, nsFocus: 'x', nsShort: '', nsMedium: '', nsLong: '' }, results: {} };
    await step.apply(ctx);
    expect(existsSync(join(proj, '.claude', 'commands', 'om-standup.md'))).toBe(true);
  });

  it('backs up an existing North Star.md instead of silently overwriting', async () => {
    const vault = join(dir, 'vault');
    mkdirSync(join(vault, 'brain'), { recursive: true });
    writeFileSync(join(vault, 'brain', 'North Star.md'), 'EXISTING');
    const ctx = { env: { stamp: 'S1', today: '2026-05-31' }, answers: { vaultPath: vault, projectDir: join(dir, 'p'), nsFocus: 'new', nsShort: '', nsMedium: '', nsLong: '' }, results: {} };
    await step.apply(ctx);
    expect(existsSync(join(vault, 'brain', 'North Star.md.bak.S1'))).toBe(true);
    expect(readFileSync(join(vault, 'brain', 'North Star.md.bak.S1'), 'utf8')).toBe('EXISTING');
  });

  it('verify confirms North Star.md and the command file exist', async () => {
    const vault = join(dir, 'vault');
    const proj = join(dir, 'proj');
    const ctx = { env: { stamp: 'S1', today: '2026-05-31' }, answers: { vaultPath: vault, projectDir: proj, nsFocus: 'x', nsShort: '', nsMedium: '', nsLong: '' }, results: {} };
    await step.apply(ctx);
    const v = await step.verify(ctx);
    expect(v.checks.every(c => c.pass)).toBe(true);
  });
});
