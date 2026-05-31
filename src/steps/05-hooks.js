import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { backupFile, mergeHooks } from '../lib/writers.js';
import { sessionStartHook } from '../data/hooks.js';
import { check } from '../lib/verify.js';

export default {
  id: 'hooks',
  title: 'Hooks',
  async inspect() { return {}; },
  explain() {
    return 'Hooks run a command automatically at certain moments. We add a SessionStart hook that shows today\'s date and your git branch — info Claude does not get on its own.';
  },
  async prompt() { return { enableHooks: true }; },
  async apply(ctx) {
    if (!ctx.answers.enableHooks) return { ok: true, changes: ['hooks skipped'] };
    const gdir = join(ctx.env.home, '.claude');
    mkdirSync(gdir, { recursive: true });
    const path = join(gdir, 'settings.json');
    let settings = {};
    if (existsSync(path)) { backupFile(path, ctx.env.stamp); settings = JSON.parse(readFileSync(path, 'utf8') || '{}'); }
    const merged = mergeHooks(settings, sessionStartHook(ctx.env.os));
    writeFileSync(path, JSON.stringify(merged, null, 2));
    return { ok: true, changes: [`hooks merged into ${path}`] };
  },
  async verify(ctx) {
    const path = join(ctx.env.home, '.claude', 'settings.json');
    return { checks: [ await check('SessionStart hook', async () => {
      if (!existsSync(path)) return { pass: false, proof: 'no settings.json' };
      const s = JSON.parse(readFileSync(path, 'utf8'));
      const present = !!(s.hooks && s.hooks.SessionStart && s.hooks.SessionStart.length);
      return { pass: present, proof: present ? 'SessionStart present' : 'missing' };
    }) ]};
  }
};
