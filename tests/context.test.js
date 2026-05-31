import { describe, it, expect } from 'vitest';
import { buildContext } from '../src/context.js';

describe('buildContext', () => {
  it('assembles env with os, pkgManager, home, stamp, run', async () => {
    const run = async (cmd, args) => ({ ok: cmd === 'which' && args[0] === 'apt-get', code: 0, stdout: '', stderr: '' });
    const ctx = await buildContext({ platform: 'linux', home: '/home/x', stamp: 'S1', today: '2026-05-31', run, io: {} });
    expect(ctx.env.os).toBe('linux');
    expect(ctx.env.io).toBeDefined();
    expect(ctx.env.pkgManager).toBe('apt');
    expect(ctx.env.home).toBe('/home/x');
    expect(ctx.env.stamp).toBe('S1');
    expect(ctx.env.today).toBe('2026-05-31');
    expect(ctx.answers).toEqual({});
    expect(ctx.results).toEqual({});
  });
});
