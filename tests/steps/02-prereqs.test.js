import { describe, it, expect } from 'vitest';
import step from '../../src/steps/02-prereqs.js';

function runner(present) {
  // present: Set of binaries that respond ok to `--version`
  return async (cmd, args) => {
    if (args.includes('--version')) return { ok: present.has(cmd), code: present.has(cmd) ? 0 : 1, stdout: present.has(cmd) ? `${cmd} 1.0` : '', stderr: '' };
    return { ok: true, code: 0, stdout: '', stderr: '' };
  };
}

describe('step 02 prereqs', () => {
  it('inspect reports git missing', async () => {
    const env = { os: 'linux', pkgManager: 'apt', run: runner(new Set()) };
    const r = await step.inspect(env);
    expect(r.needed).toContain('git');
  });

  it('apply installs only git when no on-demand plugins selected', async () => {
    const calls = [];
    const run = async (cmd, args) => { calls.push([cmd, ...args].join(' ')); return { ok: true, code: 0, stdout: 'git 1.0', stderr: '' }; };
    const env = { os: 'linux', pkgManager: 'apt', run };
    const ctx = { env, answers: { plugins: [] }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    // gh and ffmpeg not requested → not installed
    expect(calls.some(c => c.includes('gh'))).toBe(false);
    expect(calls.some(c => c.includes('ffmpeg'))).toBe(false);
  });

  it('apply adds gh when a gh-needing plugin is chosen', async () => {
    const calls = [];
    // version probes report MISSING (ok:false) so apply proceeds to install;
    // install commands succeed (ok:true). This is what tests the install path.
    const run = async (cmd, args) => {
      calls.push([cmd, ...args].join(' '));
      if (args.includes('--version')) return { ok: false, code: 1, stdout: '', stderr: '' };
      return { ok: true, code: 0, stdout: '', stderr: '' };
    };
    const env = { os: 'linux', pkgManager: 'apt', run };
    const ctx = { env, answers: { plugins: [{ name: 'gh-cli', needs: ['gh'] }] }, results: {} };
    await step.apply(ctx);
    expect(calls.some(c => c.includes('apt') && c.includes('gh'))).toBe(true);
  });
});
