import { describe, it, expect } from 'vitest';
import { detectOS, detectPkgManager, parsePluginList, parseMcpList } from '../../src/lib/detect.js';

describe('detectOS', () => {
  it('maps node platforms to friendly names', () => {
    expect(detectOS('win32')).toBe('windows');
    expect(detectOS('darwin')).toBe('mac');
    expect(detectOS('linux')).toBe('linux');
  });
});

describe('detectPkgManager', () => {
  const okFor = (name) => async (cmd, args) =>
    ({ ok: args.includes(name) || cmd === name });

  it('returns winget on windows when present', async () => {
    expect(await detectPkgManager('windows', okFor('winget'))).toBe('winget');
  });
  it('returns brew on mac when present', async () => {
    expect(await detectPkgManager('mac', okFor('brew'))).toBe('brew');
  });
  it('returns apt on linux when present', async () => {
    expect(await detectPkgManager('linux', okFor('apt-get'))).toBe('apt');
  });
  it('returns null when none found', async () => {
    const none = async () => ({ ok: false });
    expect(await detectPkgManager('linux', none)).toBe(null);
  });
});

describe('parsePluginList', () => {
  const sample = `Installed plugins:

  ❯ superpowers@superpowers-marketplace
    Version: 5.0.7
    Scope: user
    Status: ✔ enabled

  ❯ caveman@caveman
    Version: 84cc3c14fa1e
    Scope: user
    Status: ✗ disabled
`;
  it('extracts name, marketplace, enabled flag', () => {
    const got = parsePluginList(sample);
    expect(got).toEqual([
      { name: 'superpowers', marketplace: 'superpowers-marketplace', enabled: true },
      { name: 'caveman', marketplace: 'caveman', enabled: false }
    ]);
  });
  it('returns [] for empty output', () => {
    expect(parsePluginList('Installed plugins:\n')).toEqual([]);
  });

  it('handles the plain ">" marker (newer Claude CLI / non-fancy terminals)', () => {
    const out = `Installed plugins:

  > superpowers@superpowers-marketplace
    Version: 5.1.0
    Scope: user
    Status: √ enabled

  > obsidian@obsidian-skills
    Version: 1.0.1
    Scope: user
    Status: √ enabled
`;
    expect(parsePluginList(out)).toEqual([
      { name: 'superpowers', marketplace: 'superpowers-marketplace', enabled: true },
      { name: 'obsidian', marketplace: 'obsidian-skills', enabled: true }
    ]);
  });
});

describe('parseMcpList', () => {
  const sample = `Checking MCP server health…

memory: npx -y @modelcontextprotocol/server-memory - ✓ Connected
obsidian-vault: npx -y x - ✓ Connected
broken: foo - ✗ Failed to connect`;
  it('extracts name and connected flag', () => {
    const got = parseMcpList(sample);
    expect(got).toContainEqual({ name: 'memory', connected: true });
    expect(got).toContainEqual({ name: 'broken', connected: false });
  });
  it('handles heavy checkmark glyphs (✔/✘) used on some platforms', () => {
    const heavy = `qmd: qmd mcp - ✔ Connected
dead: foo - ✘ Failed to connect`;
    const got = parseMcpList(heavy);
    expect(got).toContainEqual({ name: 'qmd', connected: true });
    expect(got).toContainEqual({ name: 'dead', connected: false });
  });
});
