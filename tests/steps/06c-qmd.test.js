import { describe, it, expect } from 'vitest';
import step from '../../src/steps/06c-qmd.js';

function fakeRun(qmdPresent, mcpListOut = 'qmd: qmd mcp - ✓ Connected') {
  const calls = [];
  const run = async (cmd, args) => {
    calls.push([cmd, ...args].join(' '));
    if (cmd === 'qmd' && args[0] === '--help') return { ok: qmdPresent, code: qmdPresent ? 0 : 1, stdout: '', stderr: '' };
    if (cmd === 'claude' && args[0] === 'mcp' && args[1] === 'list') return { ok: true, code: 0, stdout: mcpListOut, stderr: '' };
    return { ok: true, code: 0, stdout: '', stderr: '' };
  };
  return { run, calls };
}

describe('step 06c qmd', () => {
  it('installs qmd when missing, inits, indexes, registers MCP', async () => {
    const { run, calls } = fakeRun(false);
    const ctx = { env: { run }, answers: { projectDir: '/home/x/Projects' }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    expect(calls.some(c => c === 'npm install -g @tobilu/qmd')).toBe(true);
    expect(calls.some(c => c === 'qmd init')).toBe(true);
    expect(calls.some(c => c === 'qmd collection add .')).toBe(true);
    expect(calls.some(c => c === 'claude mcp add qmd -s user -- qmd mcp')).toBe(true);
  });

  it('skips install when qmd already present', async () => {
    const { run, calls } = fakeRun(true);
    const ctx = { env: { run }, answers: { projectDir: '/home/x/Projects' }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    expect(calls.some(c => c.includes('npm install'))).toBe(false);
  });

  it('errors when no folder to index', async () => {
    const { run } = fakeRun(true);
    const res = await step.apply({ env: { run }, answers: {}, results: {} });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/folder/i);
  });

  it('verify passes when qmd shows in mcp list', async () => {
    const { run } = fakeRun(true);
    const ctx = { env: { run }, answers: { projectDir: '/home/x/Projects' }, results: {} };
    const v = await step.verify(ctx);
    expect(v.checks[0].pass).toBe(true);
  });
});
