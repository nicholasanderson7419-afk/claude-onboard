import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { backupFile, mergeHooks } from '../lib/writers.js';
import { sessionStartHook, ferrariAdvisorHook, ferrariAdvisorScript } from '../data/hooks.js';
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
    const hooksDir = join(gdir, 'hooks');
    mkdirSync(hooksDir, { recursive: true });
    const settingsPath = join(gdir, 'settings.json');
    let settings = {};
    if (existsSync(settingsPath)) { backupFile(settingsPath, ctx.env.stamp); settings = JSON.parse(readFileSync(settingsPath, 'utf8') || '{}'); }

    // SessionStart hook (date + branch)
    let merged = mergeHooks(settings, sessionStartHook(ctx.env.os));

    // Ferrari Advisor — write script then wire hook
    const scriptPath = join(hooksDir, 'ferrari-advisor.cjs');
    if (!existsSync(scriptPath)) writeFileSync(scriptPath, ferrariAdvisorScript());
    merged = mergeHooks(merged, ferrariAdvisorHook(hooksDir, ctx.env.os));

    writeFileSync(settingsPath, JSON.stringify(merged, null, 2));
    return { ok: true, changes: [`hooks merged into ${settingsPath}`, `ferrari-advisor.cjs → ${scriptPath}`] };
  },
  async verify(ctx) {
    const settingsPath = join(ctx.env.home, '.claude', 'settings.json');
    const scriptPath = join(ctx.env.home, '.claude', 'hooks', 'ferrari-advisor.cjs');
    return { checks: [
      await check('SessionStart hook', async () => {
        if (!existsSync(settingsPath)) return { pass: false, proof: 'no settings.json' };
        const s = JSON.parse(readFileSync(settingsPath, 'utf8'));
        const present = !!(s.hooks && s.hooks.SessionStart && s.hooks.SessionStart.length);
        return { pass: present, proof: present ? 'SessionStart present' : 'missing' };
      }),
      await check('Ferrari Advisor script', async () => {
        const present = existsSync(scriptPath);
        return { pass: present, proof: present ? scriptPath : 'not found' };
      }),
      await check('UserPromptSubmit hook', async () => {
        if (!existsSync(settingsPath)) return { pass: false, proof: 'no settings.json' };
        const s = JSON.parse(readFileSync(settingsPath, 'utf8'));
        const present = !!(s.hooks && s.hooks.UserPromptSubmit && s.hooks.UserPromptSubmit.length);
        return { pass: present, proof: present ? 'UserPromptSubmit present' : 'missing' };
      }),
    ]};
  }
};
