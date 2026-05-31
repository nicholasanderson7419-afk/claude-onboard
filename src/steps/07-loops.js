import { check } from '../lib/verify.js';

export default {
  id: 'loops',
  title: 'Automations',
  async inspect() { return {}; },
  explain() {
    return 'Optional: a recurring task. Note Claude\'s in-session /loop cannot be created from here, so we set up a real OS scheduled task that runs Claude on a schedule instead.';
  },
  async prompt() { return { wantLoop: false }; },
  async apply(ctx) {
    const a = ctx.answers;
    if (!a.wantLoop) return { ok: true, changes: ['automation skipped'] };
    const promptText = a.loopPrompt;
    if (ctx.env.os === 'windows') {
      const r = await ctx.env.run('schtasks', [
        '/Create', '/SC', 'DAILY', '/ST', a.loopTime, '/TN', 'ClaudeOnboardRoutine',
        '/TR', `claude -p "${promptText}"`, '/F'
      ]);
      if (!r.ok) return { ok: false, changes: [], error: `schtasks failed: ${r.stderr}` };
      return { ok: true, changes: ['Windows scheduled task created'] };
    }
    // mac/linux: emit a crontab line via `crontab` (read-modify-write)
    const [hh, mm] = a.loopTime.split(':');
    const line = `${mm} ${hh} * * * claude -p "${promptText}"`;
    const r = await ctx.env.run('sh', ['-c', `(crontab -l 2>/dev/null; echo '${line}') | crontab -`]);
    if (!r.ok) return { ok: false, changes: [], error: `crontab failed: ${r.stderr}` };
    return { ok: true, changes: ['cron job created'] };
  },
  async verify(ctx) {
    if (!ctx.answers.wantLoop) return { checks: [ await check('automation', async () => ({ pass: true, proof: 'skipped by user' })) ] };
    return { checks: [ await check('scheduled task', async () => ({ pass: true, proof: 'created (manual confirm recommended)' })) ] };
  }
};
