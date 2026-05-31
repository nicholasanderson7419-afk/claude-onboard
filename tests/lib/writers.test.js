import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { backupFile, appendSection } from '../../src/lib/writers.js';

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
