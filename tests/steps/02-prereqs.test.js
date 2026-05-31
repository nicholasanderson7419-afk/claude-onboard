import { describe, it, expect } from 'vitest';
import step from '../../src/steps/02-prereqs.js';

function runner(present) {
  return async (cmd, args) => {
    if (args.includes('--version')) return { ok: present.has(cmd), code: present.has(cmd) ? 0 : 1, stdout: present.has(cmd) ? `${cmd} 1.0` : '', stderr: '' };
    return { ok: true, code: 0, stdout: '', stderr: '' };
  };
}

describe('step 02 prereqs (git only)', () => {
  it('inspect reports git missing when absent', async () => {
    const r = await step.inspect({ run: runner(new Set()) });
    expect(r.needed).toContain('git');
  });
  it('inspect reports nothing needed when git present', async () => {
    const r = await step.inspect({ run: runner(new Set(['git'])) });
    expect(r.needed).toEqual([]);
  });
  it('apply installs git when missing', async () => {
    const calls = [];
    const run = async (cmd, args) => { calls.push([cmd, ...args].join(' ')); if (args.includes('--version')) return { ok: false, code: 1, stdout: '', stderr: '' }; return { ok: true, code: 0, stdout: '', stderr: '' }; };
    const res = await step.apply({ env: { os: 'linux', pkgManager: 'apt', run }, answers: {} });
    expect(res.ok).toBe(true);
    expect(calls.some(c => c.includes('apt-get') && c.includes('git'))).toBe(true);
  });
  it('apply errors clearly when no package manager', async () => {
    const run = runner(new Set());
    const res = await step.apply({ env: { os: 'linux', pkgManager: null, run }, answers: {} });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/package manager/i);
  });
});
