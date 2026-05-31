import { describe, it, expect } from 'vitest';
import { run } from '../../src/lib/exec.js';

describe('run', () => {
  it('captures stdout and ok=true on success', async () => {
    const r = await run(process.execPath, ['-e', "process.stdout.write('hi')"]);
    expect(r.ok).toBe(true);
    expect(r.code).toBe(0);
    expect(r.stdout).toBe('hi');
  });

  it('captures non-zero exit as ok=false without throwing', async () => {
    const r = await run(process.execPath, ['-e', 'process.exit(3)']);
    expect(r.ok).toBe(false);
    expect(r.code).toBe(3);
  });

  it('returns ok=false when the binary does not exist', async () => {
    const r = await run('definitely-not-a-real-binary-xyz', []);
    expect(r.ok).toBe(false);
    expect(r.stderr.length).toBeGreaterThan(0);
  });
});
