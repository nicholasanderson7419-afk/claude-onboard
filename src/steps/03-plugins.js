import { MARKETPLACES, CORE, OPTIONAL } from '../data/plugins.js';
import { addMarketplace, installPlugin, pluginList } from '../lib/claude.js';
import { parsePluginList } from '../lib/detect.js';
import { check } from '../lib/verify.js';

export default {
  id: 'plugins',
  title: 'Plugins & MCP',
  async inspect(env) {
    const r = await pluginList(env.run);
    return { installed: r.ok ? parsePluginList(r.stdout) : [] };
  },
  explain() {
    return 'Plugins add skills to Claude. We install a proven core set (superpowers, caveman, debugging, session tools) and offer extras.';
  },
  // prompt() is provided by the wizard UI layer; defaults to CORE.
  async prompt() { return { plugins: CORE }; },
  async apply(ctx) {
    const chosen = ctx.answers.plugins || CORE;
    const changes = [];
    const seenMkts = new Set();
    for (const p of chosen) {
      const source = MARKETPLACES[p.marketplace];
      if (source && !seenMkts.has(p.marketplace)) {
        await addMarketplace(ctx.env.run, source);
        seenMkts.add(p.marketplace);
        changes.push(`marketplace: ${p.marketplace}`);
      }
      const r = await installPlugin(ctx.env.run, p.name, p.marketplace);
      if (!r.ok) return { ok: false, changes, error: `install ${p.name} failed: ${r.stderr}` };
      changes.push(`installed: ${p.name}`);
    }
    return { ok: true, changes };
  },
  async verify(ctx) {
    const chosen = ctx.answers.plugins || CORE;
    const r = await pluginList(ctx.env.run);
    const present = r.ok ? parsePluginList(r.stdout) : [];
    const checks = [];
    for (const p of chosen) {
      const found = present.find(x => x.name === p.name);
      checks.push(await check(`plugin ${p.name}`, async () => ({
        pass: !!found,
        proof: found ? `installed${found.enabled ? ', enabled' : ' (active after restart)'}` : 'not found'
      })));
    }
    return { checks };
  }
};
export { CORE, OPTIONAL };
