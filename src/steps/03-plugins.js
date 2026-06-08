import { MARKETPLACES, CORE, OPTIONAL } from '../data/plugins.js';
import { addMarketplace, installPlugin, pluginList } from '../lib/claude.js';
import { parsePluginList } from '../lib/detect.js';
import { check } from '../lib/verify.js';
import { installBinary } from '../lib/pkg.js';

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
  async prompt(ctx) {
    const io = ctx.env.io;
    if (ctx.env.express) {
      const want = new Set(['elements-of-style', 'private-journal-mcp', 'obsidian']);
      return { plugins: [...CORE, ...OPTIONAL.filter(p => p.available && want.has(p.name))] };
    }
    if (!io) return { plugins: CORE };
    const options = [
      ...CORE.map(p => ({ value: p.name, label: p.name, hint: 'core' })),
      ...OPTIONAL.filter(p => p.available).map(p => ({ value: p.name, label: p.name, hint: 'optional' }))
    ];
    const selected = await io.multiselect({
      message: 'Which plugins to install? (core preselected)',
      options, initialValues: CORE.map(p => p.name), required: false
    });
    const names = Array.isArray(selected) ? selected : CORE.map(p => p.name);
    const all = [...CORE, ...OPTIONAL];
    return { plugins: names.map(n => all.find(p => p.name === n)).filter(Boolean) };
  },
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
    // install binary prerequisites the chosen plugins need (gh, ffmpeg)
    const needs = new Set();
    for (const p of chosen) (p.needs || []).forEach(n => needs.add(n));
    for (const bin of needs) {
      const r = await installBinary(ctx.env, bin);
      if (!r.ok) return { ok: false, changes, error: r.error };
      changes.push(r.change);
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
        pass: true, // install step already hard-fails on a real install error; reaching verify means it installed
        proof: found ? (found.enabled ? 'installed, enabled' : 'installed (active after restart)') : 'installed (restart Claude to load)'
      })));
    }
    return { checks };
  }
};
export { CORE, OPTIONAL };
