import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { backupFile, appendSection, mergeHooks, scaffoldTree, copyTree } from '../../src/lib/writers.js';

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'co-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('backupFile', () => {
  it('copies existing file to a timestamped .bak and returns its path', () => {
    const f = join(dir, 'CLAUDE.md');
    writeFileSync(f, 'original');
    const bak = backupFile(f, '20260531T000000');
    expect(bak).toBe(f + '.bak.20260531T000000');
    expect(existsSync(bak)).toBe(true);
    expect(readFileSync(bak, 'utf8')).toBe('original');
  });

  it('returns null when the source file does not exist', () => {
    expect(backupFile(join(dir, 'missing.md'), '20260531T000000')).toBe(null);
  });

  it('never overwrites an existing backup with the same stamp', () => {
    const f = join(dir, 'CLAUDE.md');
    writeFileSync(f, 'v1');
    backupFile(f, 'stamp1');
    writeFileSync(f, 'v2');
    const bak2 = backupFile(f, 'stamp1');
    expect(readFileSync(bak2, 'utf8')).toBe('v1');
  });
});

describe('appendSection', () => {
  it('appends a marked section when the marker is absent', () => {
    const out = appendSection('# existing\n', 'onboard:global', 'RULE ONE');
    expect(out).toContain('# existing');
    expect(out).toContain('<!-- onboard:global:start -->');
    expect(out).toContain('RULE ONE');
    expect(out).toContain('<!-- onboard:global:end -->');
  });

  it('is idempotent — re-appending the same marker does not duplicate', () => {
    const once = appendSection('base\n', 'onboard:global', 'RULE');
    const twice = appendSection(once, 'onboard:global', 'RULE');
    const count = (twice.match(/onboard:global:start/g) || []).length;
    expect(count).toBe(1);
  });

  it('replaces the section body when content changed', () => {
    const once = appendSection('base\n', 'onboard:global', 'OLD');
    const twice = appendSection(once, 'onboard:global', 'NEW');
    expect(twice).toContain('NEW');
    expect(twice).not.toContain('OLD');
  });
});

describe('mergeHooks', () => {
  const existing = {
    hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'echo a' }] }] }
  };

  it('adds a new event without touching existing ones', () => {
    const out = mergeHooks(existing, { UserPromptSubmit: [{ hooks: [{ type: 'command', command: 'echo b' }] }] });
    expect(out.hooks.SessionStart).toHaveLength(1);
    expect(out.hooks.UserPromptSubmit).toHaveLength(1);
  });

  it('does not duplicate an identical command on the same event', () => {
    const out = mergeHooks(existing, { SessionStart: [{ hooks: [{ type: 'command', command: 'echo a' }] }] });
    expect(out.hooks.SessionStart).toHaveLength(1);
  });

  it('appends a different command on an existing event', () => {
    const out = mergeHooks(existing, { SessionStart: [{ hooks: [{ type: 'command', command: 'echo NEW' }] }] });
    expect(out.hooks.SessionStart).toHaveLength(2);
  });

  it('preserves unrelated top-level keys', () => {
    const withModel = { model: 'opus', ...existing };
    const out = mergeHooks(withModel, {});
    expect(out.model).toBe('opus');
  });
});

describe('scaffoldTree', () => {
  it('creates missing dirs and seed files, reports what it created', () => {
    const created = scaffoldTree(dir, {
      'brain/': null,
      'wiki/concepts/': null,
      'North Star.md': 'goals here'
    });
    expect(existsSync(join(dir, 'brain'))).toBe(true);
    expect(existsSync(join(dir, 'wiki/concepts'))).toBe(true);
    expect(readFileSync(join(dir, 'North Star.md'), 'utf8')).toBe('goals here');
    expect(created).toContain('North Star.md');
  });

  it('never overwrites an existing note', () => {
    writeFileSync(join(dir, 'North Star.md'), 'USER CONTENT');
    const created = scaffoldTree(dir, { 'North Star.md': 'seed' });
    expect(readFileSync(join(dir, 'North Star.md'), 'utf8')).toBe('USER CONTENT');
    expect(created).not.toContain('North Star.md');
  });
});

describe('copyTree', () => {
  it('copies a file into a new dest, creating parent dirs', () => {
    const src = join(dir, 'src.md'); writeFileSync(src, 'hello');
    const res = copyTree(src, join(dir, 'a', 'b', 'dest.md'));
    expect(res.skipped).toBe(false);
    expect(readFileSync(join(dir, 'a', 'b', 'dest.md'), 'utf8')).toBe('hello');
  });

  it('copies a directory recursively', () => {
    mkdirSync(join(dir, 'srcdir'), { recursive: true });
    writeFileSync(join(dir, 'srcdir', 'SKILL.md'), 'skill');
    copyTree(join(dir, 'srcdir'), join(dir, 'out'));
    expect(readFileSync(join(dir, 'out', 'SKILL.md'), 'utf8')).toBe('skill');
  });

  it('skips when dest exists (idempotent, safe re-run)', () => {
    const src = join(dir, 's.md'); writeFileSync(src, 'new');
    const dest = join(dir, 'd.md'); writeFileSync(dest, 'OLD');
    const res = copyTree(src, dest);
    expect(res.skipped).toBe(true);
    expect(readFileSync(dest, 'utf8')).toBe('OLD');
  });

  it('throws when source is missing', () => {
    expect(() => copyTree(join(dir, 'nope'), join(dir, 'x'))).toThrow(/source missing/);
  });
});
