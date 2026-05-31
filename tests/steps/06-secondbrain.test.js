import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import step from '../../src/steps/06-secondbrain.js';

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'co-sb-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('step 06 secondbrain', () => {
  it('scaffolds vault and adds filesystem MCP at -s user with the vault path', async () => {
    const calls = [];
    const run = async (cmd, args) => { calls.push(args.join(' ')); return { ok: true, code: 0, stdout: '', stderr: '' }; };
    const vault = join(dir, 'vault');
    const ctx = { env: { run }, answers: { vaultPath: vault, enableMemory: false }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    expect(existsSync(join(vault, 'wiki', 'concepts'))).toBe(true);
    expect(existsSync(join(vault, 'brain'))).toBe(true);          // brain/ dir created, but NOT North Star.md (owned by Task 18b)
    expect(existsSync(join(vault, 'North Star.md'))).toBe(false);
    expect(calls.some(c => c.includes('mcp add obsidian-vault -s user --') && c.includes(vault))).toBe(true);
  });

  it('rejects a broad/unsafe vault path', async () => {
    const run = async () => ({ ok: true, code: 0, stdout: '', stderr: '' });
    const ctx = { env: { run, home: dir }, answers: { vaultPath: dir, enableMemory: false }, results: {} };
    // pass the user's home dir as vault → should be refused
    const res = await step.apply({ ...ctx, env: { ...ctx.env, home: dir }, answers: { vaultPath: dir } });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/dedicated/i);
  });
});
