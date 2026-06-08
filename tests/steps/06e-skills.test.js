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
  it('clones llm-council, copies bundled trading skills + om-* commands', async () => {
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
});
