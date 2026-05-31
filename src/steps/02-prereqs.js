import { check } from '../lib/verify.js';

const INSTALL = {
  winget: (pkg) => ['winget', ['install', '-e', '--id', pkg, '--silent']],
  brew:   (pkg) => ['brew', ['install', pkg]],
  apt:    (pkg) => ['sudo', ['apt-get', 'install', '-y', pkg]]
};
// winget ids differ from binary names:
const WINGET_ID = { git: 'Git.Git', gh: 'GitHub.cli', ffmpeg: 'Gyan.FFmpeg' };

async function has(run, bin) { return (await run(bin, ['--version'])).ok; }

function neededBinaries(answers) {
  const set = new Set(['git']);                       // essential
  for (const p of (answers.plugins || [])) (p.needs || []).forEach(n => set.add(n));
  return [...set];
}

export default {
  id: 'prereqs',
  title: 'Prerequisites',
  async inspect(env, answers = {}) {
    const needed = [];
    for (const bin of neededBinaries(answers)) {
      if (!(await has(env.run, bin))) needed.push(bin);
    }
    return { needed };
  },
  explain() {
    return 'Some tools live outside Claude. We install git (always) and only the extras your chosen plugins need (e.g. gh for GitHub tools, ffmpeg for video).';
  },
  async prompt() { return {}; },
  async apply(ctx) {
    const { env, answers } = ctx;
    if (!env.pkgManager) {
      return { ok: false, changes: [], error: `No package manager found for ${env.os}. Install git manually, then re-run.` };
    }
    const changes = [];
    for (const bin of neededBinaries(answers)) {
      if (await has(env.run, bin)) { changes.push(`${bin}: already present`); continue; }
      const pkg = env.pkgManager === 'winget' ? (WINGET_ID[bin] || bin) : bin;
      const [cmd, args] = INSTALL[env.pkgManager](pkg);
      const r = await env.run(cmd, args);
      if (!r.ok) return { ok: false, changes, error: `install ${bin} failed: ${r.stderr}` };
      changes.push(`installed: ${bin}`);
    }
    return { ok: true, changes };
  },
  async verify(ctx) {
    const checks = [];
    for (const bin of neededBinaries(ctx.answers)) {
      const r = await ctx.env.run(bin, ['--version']);
      checks.push(await check(bin, async () => ({ pass: r.ok, proof: r.ok ? r.stdout.split('\n')[0] : 'not found' })));
    }
    return { checks };
  }
};
