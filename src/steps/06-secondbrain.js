import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { scaffoldTree, copyTree } from '../lib/writers.js';
import { addMcp, mcpList } from '../lib/claude.js';
import { parseMcpList } from '../lib/detect.js';
import { check } from '../lib/verify.js';
import { THEMES, DEFAULT_THEME, appearanceFor } from '../data/themes.js';

const tplDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'vault');
const obsidianDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', 'obsidian');

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
    const io = ctx.env.io;
    const root = ctx.env.projectRoot || join(ctx.env.home, 'Desktop', 'Projects');
    if (ctx.env.guided && io) {
      let colorScheme = DEFAULT_THEME;
      try {
        const pick = await io.select({
          message: 'Pick your Obsidian color theme:',
          options: THEMES.map(t => ({ value: t.value, label: t.label })),
          initialValue: DEFAULT_THEME
        });
        if (pick) colorScheme = pick;
      } catch { /* no-TTY -> default */ }
      return { vaultPath: join(root, 'vault'), enableMemory: true, colorScheme };
    }
    if (ctx.env.express || ctx.env.guided) {
      return { vaultPath: join(root, 'vault'), enableMemory: true, colorScheme: DEFAULT_THEME };
    }
    if (!io) return {};
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
      'brain/': null, 'wiki/concepts/': null, 'raw/': null, 'Templates/': null,
      'MEMORY.md': readFileSync(join(tplDir, 'MEMORY.md'), 'utf8')
    });
    // NOTE: North Star.md is intentionally NOT seeded here — Task 18b (North Star
    // interview) owns it. This step only creates the brain/ directory it lives in.
    changes.push(`vault scaffolded at ${vaultPath}`);

    // Bundle the Obsidian community plugins (smart-connections, dataview, templater, mindmap, local-llm-helper)
    // into the vault so the second brain matches the reference setup. Code only — no personal data.json, no embeddings.
    if (existsSync(obsidianDir)) {
      // Copy the whole .obsidian config — plugin CODE + cleaned SETTINGS + core plugins + color snippets —
      // so the second brain is actually WIRED, not just present.
      copyTree(obsidianDir, join(vaultPath, '.obsidian'));
      // Apply the chosen color theme (overwrites the bundled default appearance.json).
      writeFileSync(join(vaultPath, '.obsidian', 'appearance.json'), JSON.stringify(appearanceFor(ctx.answers.colorScheme), null, 2));
      changes.push(`Obsidian wired into vault/.obsidian; theme: ${ctx.answers.colorScheme || DEFAULT_THEME} (click "Enable community plugins" once on first open)`);
    }

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
    checks.push(await check('Obsidian plugins bundled', async () => {
      const ok = existsSync(join(ctx.answers.vaultPath, '.obsidian', 'community-plugins.json'));
      return { pass: ok, proof: ok ? 'community-plugins.json present' : 'absent' };
    }));
    return { checks };
  }
};
