import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runWizard } from '../../src/wizard.js';
import { CORE } from '../../src/data/plugins.js';

import claudeCheck from '../../src/steps/00-claude-check.js';
import prereqs from '../../src/steps/02-prereqs.js';
import plugins from '../../src/steps/03-plugins.js';
import claudemd from '../../src/steps/04-claudemd.js';
import hooks from '../../src/steps/05-hooks.js';
import secondbrain from '../../src/steps/06-secondbrain.js';
import northstar from '../../src/steps/06b-northstar.js';
import qmd from '../../src/steps/06c-qmd.js';
import mcpServers from '../../src/steps/06d-mcp.js';
import skills from '../../src/steps/06e-skills.js';
import loops from '../../src/steps/07-loops.js';
import summary from '../../src/steps/08-summary.js';

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'co-e2e-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

function noUI() { return { intro(){}, outro(){}, note(){}, log: { step(){}, error(){}, success(){} } }; }

describe('end-to-end wizard run (fake io, fake run, temp dirs)', () => {
  it('runs every step prompt->apply without crashing and writes the key files', async () => {
    const proj = join(dir, 'proj');
    const vault = join(dir, 'vault');
    const texts = [proj, 'My Proj', 'a test project', '', vault, 'Ship the wizard', '- launch v1', '', '', 'daily standup', '09:00'];
    let ti = 0;
    const io = {
      text: async () => texts[ti++],
      confirm: async () => true,
      select: async () => 'abort',
      multiselect: async () => CORE.map(p => p.name)
    };
    // fake run: everything succeeds; --version reports present so no installs attempted
    const run = async (cmd, args) => ({ ok: true, code: 0, stdout: (args[1] === 'list' ? '' : 'ok 1.0'), stderr: '' });
    const env = { os: 'linux', pkgManager: 'apt', home: dir, stamp: 'S1', today: '2026-05-31', run, io };
    const ctx = { env, answers: {}, results: {} };
    const steps = [claudeCheck, prereqs, plugins, claudemd, hooks, secondbrain, northstar, qmd, mcpServers, skills, loops, summary];

    const out = await runWizard(steps, ctx, { decide: async () => 'abort', ui: noUI() });

    expect(out.aborted).toBe(false);
    expect(existsSync(join(proj, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(dir, '.claude', 'CLAUDE.md'))).toBe(true);
    const ns = readFileSync(join(vault, 'brain', 'North Star.md'), 'utf8');
    expect(ns).toContain('Ship the wizard');
    expect(existsSync(join(proj, '.claude', 'commands', 'om-standup.md'))).toBe(true);
  });

  it('express mode runs with ZERO prompts (io=null) and writes the key files with defaults', async () => {
    const proj = join(dir, 'Desktop', 'Projects');
    const run = async (cmd, args) => ({ ok: true, code: 0, stdout: (args && args[1] === 'list' ? '' : 'ok 1.0'), stderr: '' });
    const ctx = { env: { os: 'linux', pkgManager: 'apt', home: dir, stamp: 'S1', today: '2026-06-08', run, io: null, express: true }, answers: {}, results: {} };
    const steps = [claudeCheck, prereqs, plugins, claudemd, hooks, secondbrain, northstar, qmd, mcpServers, skills, loops, summary];

    const out = await runWizard(steps, ctx, { decide: async () => 'skip', ui: noUI() });

    expect(out.aborted).toBe(false);
    expect(existsSync(join(proj, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(dir, '.claude', 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(proj, 'vault', 'brain', 'North Star.md'))).toBe(true);
    expect(existsSync(join(proj, '.claude', 'commands', 'om-standup.md'))).toBe(true);
  });
});
