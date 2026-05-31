import { claudeOnPath } from '../lib/claude.js';

async function authProbe(run) {
  // Minimal headless round-trip. Short, cheap. ok=true ⇒ authenticated.
  const r = await run('claude', ['-p', 'ok'], { timeout: 60000 });
  return r.ok;
}

export default {
  id: 'claude-check',
  title: 'Claude Code',
  async inspect(env) {
    const ver = await claudeOnPath(env.run);
    if (!ver.ok) return { installed: false, authed: false, version: null };
    const authed = await authProbe(env.run);
    return { installed: true, authed, version: ver.stdout.trim() };
  },
  explain() {
    return 'First we make sure Claude Code itself is installed and you are logged in. Everything else builds on it.';
  },
  async prompt() { return {}; },
  async apply(ctx) {
    const s = await this.inspect(ctx.env);
    if (!s.installed) {
      return { ok: false, changes: [], error: 'Claude Code is not installed. Install it from https://docs.claude.com/claude-code then re-run.' };
    }
    if (!s.authed) {
      return { ok: false, changes: [], error: 'Claude Code is installed but not logged in. Run `claude` once and sign in, then re-run.' };
    }
    return { ok: true, changes: [`claude ${s.version} present and authenticated`] };
  },
  async verify() {
    return { checks: [] }; // gate step; apply already proves state
  }
};
