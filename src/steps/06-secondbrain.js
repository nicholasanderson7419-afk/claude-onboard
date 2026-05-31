import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { scaffoldTree } from '../lib/writers.js';
import { addMcp, mcpList } from '../lib/claude.js';
import { parseMcpList } from '../lib/detect.js';
import { check } from '../lib/verify.js';

const tplDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'vault');

function isUnsafeVault(vaultPath, home = homedir()) {
  const v = resolve(vaultPath);
  const unsafe = [resolve(home), resolve(home, 'Desktop'), resolve('/')];
  return unsafe.includes(v);
}

export default {
  id: 'secondbrain',
  title: 'Second Brain (Obsidian + memory)',
  async inspect() { return {}; },
  explain() {
    return 'This wires an Obsidian-style notes vault to Claude so it remembers across sessions. Claude gets read/write access to the vault folder only — pick a dedicated folder, not your whole drive.';
  },
  async prompt(ctx) {
    const io = ctx.env.io; if (!io) return {};
    const wantVault = await io.confirm({ message: 'Set up an Obsidian-style second brain vault? (recommended)' });
    if (!wantVault) return { skipVault: true, enableMemory: false };
    const vaultPath = await io.text({ message: 'Dedicated folder for the vault (NOT your home or Desktop root)' });
    const enableMemory = await io.confirm({ message: 'Also add the knowledge-graph memory server? (optional)' });
    return { vaultPath, enableMemory };
  },
  async apply(ctx) {
    if (ctx.answers.skipVault || !ctx.answers.vaultPath) return { ok: true, changes: ['second brain skipped'] };
    const { vaultPath, enableMemory } = ctx.answers;
    if (isUnsafeVault(vaultPath, ctx.env.home)) {
      return { ok: false, changes: [], error: 'Please choose a dedicated vault folder, not your home or Desktop root (Claude would get write access to everything under it).' };
    }
    const changes = [];
    scaffoldTree(vaultPath, {
      'brain/': null, 'wiki/concepts/': null, 'raw/': null,
      'MEMORY.md': readFileSync(join(tplDir, 'MEMORY.md'), 'utf8')
    });
    // NOTE: North Star.md is intentionally NOT seeded here — Task 18b (North Star
    // interview) owns it. This step only creates the brain/ directory it lives in.
    changes.push(`vault scaffolded at ${vaultPath}`);

    const r = await addMcp(ctx.env.run, 'obsidian-vault', 'user',
      ['npx', '-y', '@modelcontextprotocol/server-filesystem', vaultPath]);
    if (!r.ok) return { ok: false, changes, error: `add vault MCP failed: ${r.stderr}` };
    changes.push('vault MCP added (-s user)');

    if (enableMemory) {
      const m = await addMcp(ctx.env.run, 'memory', 'user',
        ['npx', '-y', '@modelcontextprotocol/server-memory']);
      if (!m.ok) return { ok: false, changes, error: `add memory MCP failed: ${m.stderr}` };
      changes.push('memory MCP added (-s user)');
    }
    return { ok: true, changes };
  },
  async verify(ctx) {
    if (ctx.answers.skipVault || !ctx.answers.vaultPath) return { checks: [{ name: 'second brain', pass: true, proof: 'skipped by user' }] };
    const r = await mcpList(ctx.env.run);
    const servers = r.ok ? parseMcpList(r.stdout) : [];
    const find = (n) => servers.find(s => s.name === n);
    const checks = [ await check('vault MCP connected', async () => {
      const s = find('obsidian-vault');
      return { pass: !!(s && s.connected), proof: s ? (s.connected ? 'connected' : 'not connected') : 'absent' };
    }) ];
    if (ctx.answers.enableMemory) checks.push(await check('memory MCP connected', async () => {
      const s = find('memory');
      return { pass: !!(s && s.connected), proof: s ? (s.connected ? 'connected' : 'not connected') : 'absent' };
    }));
    return { checks };
  }
};
