import { check } from '../lib/verify.js';
import { hasBinary, installBinary } from '../lib/pkg.js';

export default {
  id: 'prereqs',
  title: 'Prerequisites',
  async inspect(env) {
    return { needed: (await hasBinary(env.run, 'git')) ? [] : ['git'] };
  },
  explain() {
    return 'Some tools live outside Claude. We install git (always required). Extra tools like gh or ffmpeg are installed later only if a plugin you pick needs them.';
  },
  async prompt() { return {}; },
  async apply(ctx) {
    const r = await installBinary(ctx.env, 'git');
    if (!r.ok) return { ok: false, changes: [], error: r.error };
    return { ok: true, changes: [r.change] };
  },
  async verify(ctx) {
    const r = await ctx.env.run('git', ['--version']);
    return { checks: [ await check('git', async () => ({ pass: r.ok, proof: r.ok ? r.stdout.split('\n')[0] : 'not found' })) ] };
  }
};
