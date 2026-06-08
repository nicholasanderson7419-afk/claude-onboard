import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { CLONE_SKILLS, BUNDLED_SKILLS, BUNDLED_COMMANDS } from '../data/skills.js';
import { skillsForGoals } from '../data/goals.js';
import { copyTree } from '../lib/writers.js';
import { check } from '../lib/verify.js';

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets');
const FULL_SET = { council: true, omCommands: true };

export default {
  id: 'skills',
  title: 'Skills & commands',
  async inspect() { return {}; },
  explain() {
    return 'Installs extra skills + slash-commands: the llm-council decision skill and the om-* second-brain command suite. In guided mode these are tailored to the goals you picked.';
  },
  async prompt(ctx) {
    const io = ctx.env.io;
    // Concierge: tailor skills to the stated goals (set by step 03).
    if (ctx.env.guided && Array.isArray(ctx.answers.goals) && ctx.answers.goals.length) {
      const set = skillsForGoals(ctx.answers.goals);
      return {
        wantSkills: set.size > 0,
        skills: { council: set.has('llm-council'), omCommands: set.has('om-commands') }
      };
    }
    // express, guided-with-no-answerable-goal (no-TTY), or no UI -> sensible full set
    if (!io || ctx.env.express || ctx.env.guided) return { wantSkills: true, skills: FULL_SET };
    // interactive
    const wantSkills = await io.confirm({
      message: 'Install the llm-council decision skill + the om-* command suite?'
    });
    return { wantSkills, skills: FULL_SET };
  },
  async apply(ctx) {
    if (ctx.answers.wantSkills === false) return { ok: true, changes: ['skills/commands skipped'] };
    const sel = ctx.answers.skills || FULL_SET;
    const skillsRoot = join(ctx.env.home, '.claude', 'skills');
    const changes = [];

    // 1. git-clone skills (real upstream) — gated by selection
    for (const s of CLONE_SKILLS) {
      if (s.name === 'llm-council' && !sel.council) continue;
      const dest = join(skillsRoot, s.name);
      if (existsSync(dest)) { changes.push(`skill ${s.name}: already present`); continue; }
      const r = await ctx.env.run('git', ['clone', '--depth', '1', s.repo, dest]);
      if (!r.ok) return { ok: false, changes, error: `clone ${s.name} failed: ${r.stderr}` };
      changes.push(`cloned skill: ${s.name}`);
    }

    // 2. bundled skills -> ~/.claude/skills/<name>
    //    (none after the trading skills were removed; loop kept for future general skills)
    for (const name of BUNDLED_SKILLS) {
      const res = copyTree(join(assetsDir, 'skills', name), join(skillsRoot, name));
      changes.push(res.skipped ? `skill ${name}: already present` : `installed skill: ${name}`);
    }

    // 3. bundled commands -> <projectDir>/.claude/commands/<file> — gated by selection
    const projectDir = ctx.answers.projectDir;
    if (!sel.omCommands) {
      changes.push('om-* commands skipped (not implied by goals)');
    } else if (projectDir) {
      const cmdRoot = join(projectDir, '.claude', 'commands');
      for (const file of BUNDLED_COMMANDS) {
        const res = copyTree(join(assetsDir, 'commands', file), join(cmdRoot, file));
        changes.push(res.skipped ? `command ${file}: already present` : `installed command: ${file}`);
      }
    } else {
      changes.push('commands skipped (no project dir set)');
    }
    return { ok: true, changes };
  },
  async verify(ctx) {
    if (ctx.answers.wantSkills === false) {
      return { checks: [{ name: 'skills/commands', pass: true, proof: 'skipped by user' }] };
    }
    const sel = ctx.answers.skills || FULL_SET;
    const skillsRoot = join(ctx.env.home, '.claude', 'skills');
    const checks = [];
    for (const s of CLONE_SKILLS) {
      if (s.name === 'llm-council' && !sel.council) continue;
      checks.push(await check(`skill ${s.name}`, async () => {
        const ok = existsSync(join(skillsRoot, s.name));
        return { pass: ok, proof: ok ? 'present' : 'absent (clone may need network)' };
      }));
    }
    for (const name of BUNDLED_SKILLS) {
      checks.push(await check(`skill ${name}`, async () => {
        const ok = existsSync(join(skillsRoot, name, 'SKILL.md'));
        return { pass: ok, proof: ok ? 'SKILL.md present' : 'absent' };
      }));
    }
    if (!checks.length) checks.push({ name: 'skills/commands', pass: true, proof: 'none implied by goals' });
    return { checks };
  }
};
export { CLONE_SKILLS, BUNDLED_SKILLS, BUNDLED_COMMANDS };
