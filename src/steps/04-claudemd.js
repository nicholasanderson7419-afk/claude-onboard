import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { backupFile, appendSection } from '../lib/writers.js';
import { check } from '../lib/verify.js';

const tplDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates');
const tpl = (name) => readFileSync(join(tplDir, name), 'utf8');

function pluginRules(plugins) {
  if (!plugins.length) return '';
  const names = plugins.map(p => p.name).join(', ');
  return `\n## Installed plugins\nYou have these plugins available: ${names}. Use them when relevant.`;
}

export default {
  id: 'claudemd',
  title: 'CLAUDE.md',
  async inspect() { return {}; },
  explain() {
    return 'CLAUDE.md is the memory/rules file Claude reads every session. We write a global one (how you like to work) and a project one (what you are building).';
  },
  async prompt(ctx) {
    const io = ctx.env.io;
    if (ctx.env.express) {
      const root = ctx.env.projectRoot || join(ctx.env.home, 'Desktop', 'Projects');
      return { projectDir: root, projectName: 'My Project', projectDesc: 'Configured with claude-onboard.', conventions: '' };
    }
    if (!io) return {};
    const projectDir = (await io.text({ message: 'Path to your project folder?', placeholder: process.cwd() })) || process.cwd();
    const projectName = (await io.text({ message: 'Project name?' })) || 'My Project';
    const projectDesc = (await io.text({ message: 'One sentence — what is it?' })) || '';
    const conventions = (await io.text({ message: 'Any conventions/rules to note? (optional)' })) || '';
    return { projectDir, projectName, projectDesc, conventions };
  },
  async apply(ctx) {
    const { home, stamp } = ctx.env;
    const a = ctx.answers;
    const changes = [];

    // global
    const gdir = join(home, '.claude');
    mkdirSync(gdir, { recursive: true });
    const gpath = join(gdir, 'CLAUDE.md');
    const base = existsSync(gpath) ? (backupFile(gpath, stamp), readFileSync(gpath, 'utf8')) : '';
    const body = tpl('claude-md.global.md').replace('{{PLUGIN_RULES}}', pluginRules(a.plugins || []));
    writeFileSync(gpath, appendSection(base, 'onboard:global', body));
    changes.push(`wrote ${gpath}`);

    // project
    mkdirSync(a.projectDir, { recursive: true });
    const ppath = join(a.projectDir, 'CLAUDE.md');
    if (existsSync(ppath)) backupFile(ppath, stamp);
    const proj = tpl('claude-md.project.md')
      .replace('{{PROJECT_NAME}}', a.projectName)
      .replace('{{PROJECT_DESC}}', a.projectDesc)
      .replace('{{CONVENTIONS}}', a.conventions);
    writeFileSync(ppath, proj);
    changes.push(`wrote ${ppath}`);

    return { ok: true, changes };
  },
  async verify(ctx) {
    const gpath = join(ctx.env.home, '.claude', 'CLAUDE.md');
    const ppath = join(ctx.answers.projectDir, 'CLAUDE.md');
    return { checks: [
      await check('global CLAUDE.md', async () => ({ pass: existsSync(gpath), proof: gpath })),
      await check('project CLAUDE.md', async () => ({ pass: existsSync(ppath), proof: ppath }))
    ]};
  }
};
