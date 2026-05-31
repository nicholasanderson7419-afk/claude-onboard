import { describe, it, expect } from 'vitest';
import { addMarketplace, installPlugin, addMcp, pluginList } from '../../src/lib/claude.js';

const spy = () => {
  const calls = [];
  const run = async (cmd, args) => { calls.push([cmd, args]); return { ok: true, code: 0, stdout: '', stderr: '' }; };
  return { run, calls };
};

describe('claude wrappers', () => {
  it('addMarketplace calls: claude plugin marketplace add <source>', async () => {
    const { run, calls } = spy();
    await addMarketplace(run, 'obra/superpowers-marketplace');
    expect(calls[0]).toEqual(['claude', ['plugin', 'marketplace', 'add', 'obra/superpowers-marketplace']]);
  });

  it('installPlugin calls: claude plugin install <name>@<mkt> -s user', async () => {
    const { run, calls } = spy();
    await installPlugin(run, 'superpowers', 'superpowers-marketplace');
    expect(calls[0]).toEqual(['claude', ['plugin', 'install', 'superpowers@superpowers-marketplace', '-s', 'user']]);
  });

  it('addMcp calls: claude mcp add <name> -s user -- <cmd...>', async () => {
    const { run, calls } = spy();
    await addMcp(run, 'memory', 'user', ['npx', '-y', '@modelcontextprotocol/server-memory']);
    expect(calls[0]).toEqual(['claude', ['mcp', 'add', 'memory', '-s', 'user', '--', 'npx', '-y', '@modelcontextprotocol/server-memory']]);
  });

  it('pluginList passes through stdout', async () => {
    const run = async () => ({ ok: true, code: 0, stdout: 'PLUGINS', stderr: '' });
    expect((await pluginList(run)).stdout).toBe('PLUGINS');
  });
});
