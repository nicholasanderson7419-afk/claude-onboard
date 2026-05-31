import { describe, it, expect } from 'vitest';
import { runWizard } from '../src/wizard.js';

const okStep = (id) => ({
  id, title: id,
  async inspect() { return {}; }, explain() { return id; },
  async prompt() { return {}; },
  async apply() { return { ok: true, changes: [id] }; },
  async verify() { return { checks: [{ name: id, pass: true, proof: 'ok' }] }; }
});

describe('runWizard', () => {
  it('runs all steps and records results', async () => {
    const ctx = { env: {}, answers: {}, results: {} };
    const out = await runWizard([okStep('a'), okStep('b')], ctx, { decide: async () => 'abort', ui: noUI() });
    expect(Object.keys(out.results)).toEqual(['a', 'b']);
    expect(out.aborted).toBe(false);
  });

  it('aborts immediately if the gate step (index 0) fails', async () => {
    const gate = { ...okStep('claude-check'), apply: async () => ({ ok: false, error: 'no claude' }) };
    const ctx = { env: {}, answers: {}, results: {} };
    const out = await runWizard([gate, okStep('b')], ctx, { decide: async () => 'abort', ui: noUI() });
    expect(out.aborted).toBe(true);
    expect(out.results.b).toBeUndefined();
  });

  it('on a non-gate failure, follows the decide() choice (skip → continue)', async () => {
    const bad = { ...okStep('bad'), apply: async () => ({ ok: false, error: 'boom' }) };
    const ctx = { env: {}, answers: {}, results: {} };
    const out = await runWizard([okStep('claude-check'), bad, okStep('c')], ctx, { decide: async () => 'skip', ui: noUI() });
    expect(out.aborted).toBe(false);
    expect(out.results.c).toBeDefined();
  });
});

function noUI() {
  return { intro(){}, outro(){}, note(){}, log: { step(){}, error(){}, success(){} } };
}
