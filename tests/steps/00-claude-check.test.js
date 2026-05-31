import { describe, it, expect } from 'vitest';
import step from '../../src/steps/00-claude-check.js';

const ctxWith = (run) => ({ env: { run }, answers: {}, results: {} });

describe('step 00 claude-check', () => {
  it('inspect reports missing when claude --version fails to spawn', async () => {
    const run = async () => ({ ok: false, code: null, stdout: '', stderr: 'ENOENT' });
    const r = await step.inspect(ctxWith(run).env);
    expect(r.installed).toBe(false);
  });

  it('inspect reports installed + authed when version ok and probe ok', async () => {
    const run = async (cmd, args) => {
      if (args.includes('--version')) return { ok: true, code: 0, stdout: '1.2.3', stderr: '' };
      return { ok: true, code: 0, stdout: 'ok', stderr: '' }; // auth probe
    };
    const r = await step.inspect(ctxWith(run).env);
    expect(r.installed).toBe(true);
    expect(r.authed).toBe(true);
  });

  it('apply returns ok=false with guidance when not installed', async () => {
    const run = async () => ({ ok: false, code: null, stdout: '', stderr: 'ENOENT' });
    const ctx = ctxWith(run);
    const res = await step.apply(ctx);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/install/i);
  });
});
