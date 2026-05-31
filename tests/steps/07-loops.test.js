import { describe, it, expect } from 'vitest';
import step from '../../src/steps/07-loops.js';

describe('step 07 loops', () => {
  it('skips cleanly when user wants no automation', async () => {
    const ctx = { env: { os: 'linux', run: async () => ({ ok: true }) }, answers: { wantLoop: false }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    expect(res.changes[0]).toMatch(/skip/i);
  });

  it('on windows builds a schtasks command running claude -p', async () => {
    const calls = [];
    const run = async (cmd, args) => { calls.push([cmd, ...args].join(' ')); return { ok: true, code: 0, stdout: '', stderr: '' }; };
    const ctx = { env: { os: 'windows', run }, answers: { wantLoop: true, loopPrompt: 'daily standup', loopTime: '09:00' }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    expect(calls.some(c => c.toLowerCase().includes('schtasks') && c.includes('claude'))).toBe(true);
  });
});
