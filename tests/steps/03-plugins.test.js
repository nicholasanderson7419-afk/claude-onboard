import { describe, it, expect } from 'vitest';
import step from '../../src/steps/03-plugins.js';

function fakeRun(script) {
  const calls = [];
  const run = async (cmd, args) => {
    calls.push(args.join(' '));
    if (args[0] === 'plugin' && args[1] === 'list') return { ok: true, code: 0, stdout: script.list, stderr: '' };
    return { ok: true, code: 0, stdout: '', stderr: '' };
  };
  return { run, calls };
}

describe('step 03 plugins', () => {
  it('apply adds each needed marketplace then installs chosen plugins', async () => {
    const { run, calls } = fakeRun({ list: '' });
    const ctx = { env: { run }, answers: { plugins: [{ name: 'superpowers', marketplace: 'superpowers-marketplace' }] }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    expect(calls.some(c => c === 'plugin marketplace add obra/superpowers-marketplace')).toBe(true);
    expect(calls.some(c => c === 'plugin install superpowers@superpowers-marketplace -s user')).toBe(true);
  });

  it('verify passes when plugin is present even if not yet enabled (restart-aware)', async () => {
    const list = `Installed plugins:\n\n  ❯ superpowers@superpowers-marketplace\n    Status: ✗ disabled\n`;
    const { run } = fakeRun({ list });
    const ctx = { env: { run }, answers: { plugins: [{ name: 'superpowers', marketplace: 'superpowers-marketplace' }] }, results: {} };
    const v = await step.verify(ctx);
    const c = v.checks.find(x => x.name.includes('superpowers'));
    expect(c.pass).toBe(true);
    expect(c.proof).toMatch(/installed/i);
  });
});
