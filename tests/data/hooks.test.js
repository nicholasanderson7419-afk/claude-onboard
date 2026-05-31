import { describe, it, expect } from 'vitest';
import { sessionStartHook } from '../../src/data/hooks.js';

describe('sessionStartHook', () => {
  it('windows uses powershell, prints date and branch', () => {
    const h = sessionStartHook('windows');
    const cmd = h.SessionStart[0].hooks[0].command;
    expect(cmd).toMatch(/powershell/i);
    expect(cmd).toMatch(/Get-Date/);
  });
  it('unix uses sh, prints date and branch', () => {
    const h = sessionStartHook('linux');
    const cmd = h.SessionStart[0].hooks[0].command;
    expect(cmd).toMatch(/date/);
    expect(cmd).toMatch(/git/);
  });
});
