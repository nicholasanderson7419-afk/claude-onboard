import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { backupFile } from '../lib/writers.js';
import { check } from '../lib/verify.js';

const tplDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates');
const tpl = (name) => readFileSync(join(tplDir, name), 'utf8');

function blank(v) { return (v && v.trim()) ? v : '-'; }

export default {
  id: 'northstar',
  title: 'North Star',
  async inspect() { return {}; },
  explain() {
    return 'Your North Star is a living goals file Claude reads at the start of every session, so it always knows what you are working toward. It is the single most useful piece of context you can give Claude — so we build it together now.';
  },
  async prompt() { return {}; }, // UI layer collects nsFocus/nsShort/nsMedium/nsLong
  async apply(ctx) {
    const a = ctx.answers;
    const changes = [];

    // 1. North Star.md
    const brainDir = join(a.vaultPath, 'brain');
    mkdirSync(brainDir, { recursive: true });
    const nsPath = join(brainDir, 'North Star.md');
    if (existsSync(nsPath)) backupFile(nsPath, ctx.env.stamp);
    const ns = tpl('north-star.md')
      .replace('{{DATE}}', ctx.env.today)
      .replace('{{FOCUS}}', blank(a.nsFocus))
      .replace('{{SHORT}}', blank(a.nsShort))
      .replace('{{MEDIUM}}', blank(a.nsMedium))
      .replace('{{LONG}}', blank(a.nsLong));
    writeFileSync(nsPath, ns);
    changes.push(`wrote ${nsPath}`);

    // 2. om-standup-lite command in the project
    const cmdDir = join(a.projectDir, '.claude', 'commands');
    mkdirSync(cmdDir, { recursive: true });
    const cmdPath = join(cmdDir, 'om-standup.md');
    if (!existsSync(cmdPath)) { writeFileSync(cmdPath, tpl('om-standup.md')); changes.push(`installed /om-standup at ${cmdPath}`); }
    else changes.push('/om-standup already present');

    return { ok: true, changes };
  },
  async verify(ctx) {
    const nsPath = join(ctx.answers.vaultPath, 'brain', 'North Star.md');
    const cmdPath = join(ctx.answers.projectDir, '.claude', 'commands', 'om-standup.md');
    return { checks: [
      await check('North Star.md', async () => ({ pass: existsSync(nsPath), proof: nsPath })),
      await check('/om-standup command', async () => ({ pass: existsSync(cmdPath), proof: cmdPath }))
    ]};
  }
};
