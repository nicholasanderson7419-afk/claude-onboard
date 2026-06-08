import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import step from '../../src/steps/06e-skills.js';
import { BUNDLED_SKILLS, BUNDLED_COMMANDS } from '../../src/data/skills.js';

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'co-skills-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

// fake run that simulates `git clone` by creating the dest dir + a SKILL.md
function fakeRunCloning() {
  const calls = [];
  const run = async (cmd, args) => {
    calls.push([cmd, ...args].join(' '));
    if (cmd === 'git' && args[0] === 'clone') {
      const dest = args[args.length - 1];
      mkdirSync(dest, { recursive: true });
      writeFileSync(join(dest, 'SKILL.md'), '# cloned');
    }
    return { ok: true, code: 0, stdout: '', stderr: '' };
  };
  return { run, calls };
}

describe('step 06e skills', () => {
  it('clones llm-council + copies om-* commands (default full set)', async () => {
    const { run, calls } = fakeRunCloning();
    const proj = join(dir, 'proj');
    const ctx = { env: { home: dir, run }, answers: { wantSkills: true, projectDir: proj }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    expect(calls.some(c => c.includes('git clone --depth 1 https://github.com/tenfoldmarc/llm-council-skill'))).toBe(true);
    for (const s of BUNDLED_SKILLS) {
      expect(existsSync(join(dir, '.claude', 'skills', s, 'SKILL.md')), s).toBe(true);
    }
    for (const f of BUNDLED_COMMANDS) {
      expect(existsSync(join(proj, '.claude', 'commands', f)), f).toBe(true);
    }
  });

  it('skips entirely when the user declines', async () => {
    const { run, calls } = fakeRunCloning();
    const res = await step.apply({ env: { home: dir, run }, answers: { wantSkills: false }, results: {} });
    expect(res.ok).toBe(true);
    expect(calls.length).toBe(0);
    expect(existsSync(join(dir, '.claude', 'skills'))).toBe(false);
  });

  it('verify passes after a successful apply', async () => {
    const { run } = fakeRunCloning();
    const proj = join(dir, 'proj');
    const ctx = { env: { home: dir, run }, answers: { wantSkills: true, projectDir: proj }, results: {} };
    await step.apply(ctx);
    const v = await step.verify(ctx);
    expect(v.checks.every(c => c.pass)).toBe(true);
  });

  it('guided "write" -> council + om-* commands', async () => {
    const { run } = fakeRunCloning();
    const proj = join(dir, 'proj');
    const ctx = { env: { home: dir, run, guided: true, io: {} }, answers: { goals: ['write'], projectDir: proj }, results: {} };
    const sel = await step.prompt(ctx);
    expect(sel.wantSkills).toBe(true);
    Object.assign(ctx.answers, sel);
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    expect(existsSync(join(dir, '.claude', 'skills', 'llm-council', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(proj, '.claude', 'commands', 'om-dump.md'))).toBe(true);
  });

  it('guided "build" -> council only, NO om-* commands', async () => {
    const { run } = fakeRunCloning();
    const proj = join(dir, 'proj');
    const ctx = { env: { home: dir, run, guided: true, io: {} }, answers: { goals: ['build'], projectDir: proj }, results: {} };
    const sel = await step.prompt(ctx);
    expect(sel.skills).toEqual({ council: true, omCommands: false });
    Object.assign(ctx.answers, sel);
    await step.apply(ctx);
    expect(existsSync(join(dir, '.claude', 'skills', 'llm-council', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(proj, '.claude', 'commands', 'om-dump.md'))).toBe(false);
  });

  it('guided "automate" -> no skills installed at all', async () => {
    const { run, calls } = fakeRunCloning();
    const ctx = { env: { home: dir, run, guided: true, io: {} }, answers: { goals: ['automate'] }, results: {} };
    const sel = await step.prompt(ctx);
    expect(sel.wantSkills).toBe(false);
    Object.assign(ctx.answers, sel);
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    expect(calls.length).toBe(0);
  });
});
