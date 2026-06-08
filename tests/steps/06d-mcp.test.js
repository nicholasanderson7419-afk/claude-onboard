import { describe, it, expect } from 'vitest';
import step from '../../src/steps/06d-mcp.js';
import { MCP_SERVERS } from '../../src/data/mcp.js';

function fakeRun(mcpListOut = '') {
  const calls = [];
  const run = async (cmd, args) => {
    calls.push([cmd, ...args].join(' '));
    if (cmd === 'claude' && args[0] === 'mcp' && args[1] === 'list') {
      return { ok: true, code: 0, stdout: mcpListOut, stderr: '' };
    }
    return { ok: true, code: 0, stdout: '', stderr: '' };
  };
  return { run, calls };
}

const find = (n) => MCP_SERVERS.find(s => s.name === n);

describe('step 06d mcp-servers', () => {
  it('registers each chosen server via claude mcp add', async () => {
    const { run, calls } = fakeRun();
    const ctx = { env: { run }, answers: { mcpServers: [find('playwright'), find('ruflo')] }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    expect(calls.some(c => c === 'claude mcp add playwright -s user -- npx @playwright/mcp@latest')).toBe(true);
    expect(calls.some(c => c === 'claude mcp add ruflo -s user -- npx -y ruflo@latest')).toBe(true);
  });

  it('passes env vars as -e flags for claude-flow', async () => {
    const { run, calls } = fakeRun();
    const ctx = { env: { run }, answers: { mcpServers: [find('claude-flow')] }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    const call = calls.find(c => c.startsWith('claude mcp add claude-flow'));
    expect(call).toMatch(/-e CLAUDE_FLOW_MODE=v3/);
    expect(call).toMatch(/-e CLAUDE_FLOW_MAX_AGENTS=8/);
    expect(call).toMatch(/-- npx -y @claude-flow\/cli@latest mcp start$/);
  });

  it('no-op (ok) when nothing selected', async () => {
    const { run, calls } = fakeRun();
    const res = await step.apply({ env: { run }, answers: { mcpServers: [] }, results: {} });
    expect(res.ok).toBe(true);
    expect(calls.some(c => c.includes('mcp add'))).toBe(false);
  });

  it('reports failure if an add fails', async () => {
    const run = async (cmd, args) => {
      if (args.includes('add')) return { ok: false, code: 1, stdout: '', stderr: 'boom' };
      return { ok: true, code: 0, stdout: '', stderr: '' };
    };
    const res = await step.apply({ env: { run }, answers: { mcpServers: [find('playwright')] }, results: {} });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/playwright/);
  });

  it('verify passes when chosen server shows connected in mcp list', async () => {
    const { run } = fakeRun('playwright: npx @playwright/mcp@latest - ✓ Connected');
    const ctx = { env: { run }, answers: { mcpServers: [find('playwright')] }, results: {} };
    const v = await step.verify(ctx);
    expect(v.checks[0].pass).toBe(true);
  });

  it('verify is a pass-skip when nothing selected', async () => {
    const { run } = fakeRun();
    const v = await step.verify({ env: { run }, answers: { mcpServers: [] }, results: {} });
    expect(v.checks[0].pass).toBe(true);
  });
});
