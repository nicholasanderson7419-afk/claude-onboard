import { addMcp, mcpList } from '../lib/claude.js';
import { parseMcpList } from '../lib/detect.js';
import { check } from '../lib/verify.js';

async function qmdInstalled(run) { return (await run('qmd', ['--help'])).ok; }

export default {
  id: 'qmd',
  title: 'Search (QMD)',
  async inspect(env) { return { installed: await qmdInstalled(env.run) }; },
  explain() {
    return 'QMD gives Claude a search engine over your notes — it finds the right note by meaning, not just keywords, so Claude does not have to read every file. It indexes your home-base folder. (The semantic-search models download automatically the first time you have notes to search.)';
  },
  async prompt() { return {}; }, // always install (no opt-out)
  async apply(ctx) {
    const { run } = ctx.env;
    const indexDir = ctx.answers.projectDir || ctx.answers.vaultPath;
    if (!indexDir) return { ok: false, changes: [], error: 'No folder to index (project/vault not set).' };
    const changes = [];
    if (!(await qmdInstalled(run))) {
      const r = await run('npm', ['install', '-g', '@tobilu/qmd']);
      if (!r.ok) return { ok: false, changes, error: `qmd install failed: ${r.stderr}` };
      changes.push('installed qmd (@tobilu/qmd)');
    } else {
      changes.push('qmd: already present');
    }
    const init = await run('qmd', ['init'], { cwd: indexDir });
    if (!init.ok) return { ok: false, changes, error: `qmd init failed: ${init.stderr}` };
    changes.push(`qmd index created in ${indexDir}`);

    const add = await run('qmd', ['collection', 'add', '.'], { cwd: indexDir });
    if (!add.ok) return { ok: false, changes, error: `qmd collection add failed: ${add.stderr}` };
    changes.push('indexed markdown (**/*.md)');

    const m = await addMcp(run, 'qmd', 'user', ['qmd', 'mcp']);
    if (!m.ok) return { ok: false, changes, error: `register qmd MCP failed: ${m.stderr}` };
    changes.push('qmd MCP registered (-s user)');
    return { ok: true, changes };
  },
  async verify(ctx) {
    const r = await mcpList(ctx.env.run);
    const servers = r.ok ? parseMcpList(r.stdout) : [];
    const s = servers.find(x => x.name === 'qmd');
    return { checks: [ await check('qmd MCP', async () => ({ pass: !!s, proof: s ? (s.connected ? 'connected' : 'registered') : 'absent' })) ] };
  }
};
