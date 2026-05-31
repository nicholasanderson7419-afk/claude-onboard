import { describe, it, expect } from 'vitest';
import { check } from '../../src/lib/verify.js';

describe('check', () => {
  it('returns pass=true with proof from the fn', async () => {
    const r = await check('git present', async () => ({ pass: true, proof: 'git 2.4' }));
    expect(r).toEqual({ name: 'git present', pass: true, proof: 'git 2.4' });
  });
  it('captures a thrown error as pass=false', async () => {
    const r = await check('boom', async () => { throw new Error('nope'); });
    expect(r.pass).toBe(false);
    expect(r.proof).toContain('nope');
  });
});
