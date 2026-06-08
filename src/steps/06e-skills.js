import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { CLONE_SKILLS, BUNDLED_SKILLS, BUNDLED_COMMANDS } from '../data/skills.js';
import { copyTree } from '../lib/writers.js';
import { check } from '../lib/verify.js';

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets');

export default {
  id: 'skills',
  title: 'Skills & commands',
  async inspect() { return {}; },
  explain() {
    return 'Installs extra skills + slash-commands: the llm-council decision skill, the prediction-market / Itô trading skills, and the om-* second-brain command suite.';
  },
  async prompt(ctx) {
    const io = ctx.env.io;
    if (!io || ctx.env.guided) return { wantSkills: true };
    const wantSkills = await io.confirm({
      message: 'Install extra skills (llm-council + trading) and the om-* command suite?'
    });
    return { wantSkills };
  },
  async apply(ctx) {
    if (ctx.answers.wantSkills === false) return { ok: true, changes: ['skills/commands skipped'] };
    const skillsRoot = join(ctx.env.home, '.claude', 'skills');
    const changes = [];

    // 1. git-clone skills (real upstream)
    for (const s of CLONE_SKILLS) {
      const dest = join(skillsRoot, s.name);
      if (existsSync(dest)) { changes.push(`skill ${s.name}: already present`); continue; }
      const r = await ctx.env.run('git', ['clone', '--depth', '1', s.repo, dest]);
      if (!r.ok) return { ok: false, changes, error: `clone ${s.name} failed: ${r.stderr}` };
      changes.push(`cloned skill: ${s.name}`);
    }

    // 2. bundled skills → ~/.claude/skills/<name>
    for (const name of BUNDLED_SKILLS) {
      const res = copyTree(join(assetsDir, 'skills', name), join(skillsRoot, name));
      changes.push(res.skipped ? `skill ${name}: already present` : `installed skill: ${name}`);
    }

    // 3. bundled commands → <projectDir>/.claude/commands/<file>
    const projectDir = ctx.answers.projectDir;
    if (projectDir) {
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
    const skillsRoot = join(ctx.env.home, '.claude', 'skills');
    const checks = [];
    for (const s of CLONE_SKILLS) {
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
    return { checks };
  }
};
export { CLONE_SKILLS, BUNDLED_SKILLS, BUNDLED_COMMANDS };
