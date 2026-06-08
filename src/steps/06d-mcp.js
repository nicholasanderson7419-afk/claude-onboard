import { MCP_SERVERS } from '../data/mcp.js';
import { addMcp, mcpList } from '../lib/claude.js';
import { parseMcpList } from '../lib/detect.js';
import { check } from '../lib/verify.js';

export default {
  id: 'mcp-servers',
  title: 'Extra MCP servers',
  async inspect(env) {
    const r = await mcpList(env.run);
    return { installed: r.ok ? parseMcpList(r.stdout) : [] };
  },
  explain() {
    return 'Optional tool servers for Claude: browser automation (playwright) and agent orchestration (ruflo, claude-flow). All optional — none preselected.';
  },
  async prompt(ctx) {
    const io = ctx.env.io;
    if (!io || ctx.env.guided) return { mcpServers: [] };
    const options = MCP_SERVERS.filter(s => s.available)
      .map(s => ({ value: s.name, label: s.name, hint: s.desc }));
    const selected = await io.multiselect({
      message: 'Add any optional MCP servers? (none preselected)',
      options, initialValues: [], required: false
    });
    const names = Array.isArray(selected) ? selected : [];
    return { mcpServers: MCP_SERVERS.filter(s => names.includes(s.name)) };
  },
  async apply(ctx) {
    const chosen = ctx.answers.mcpServers || [];
    if (!chosen.length) return { ok: true, changes: ['no extra MCP servers selected'] };
    const changes = [];
    for (const s of chosen) {
      const r = await addMcp(ctx.env.run, s.name, s.scope || 'user', s.command, s.env || {});
      if (!r.ok) return { ok: false, changes, error: `add ${s.name} MCP failed: ${r.stderr}` };
      changes.push(`MCP added: ${s.name}`);
    }
    return { ok: true, changes };
  },
  async verify(ctx) {
    const chosen = ctx.answers.mcpServers || [];
    if (!chosen.length) return { checks: [{ name: 'extra MCP', pass: true, proof: 'none selected' }] };
    const r = await mcpList(ctx.env.run);
    const servers = r.ok ? parseMcpList(r.stdout) : [];
    const checks = [];
    for (const s of chosen) {
      const found = servers.find(x => x.name === s.name);
      checks.push(await check(`MCP ${s.name}`, async () => ({
        pass: !!found,
        proof: found ? (found.connected ? 'connected' : 'registered') : 'absent'
      })));
    }
    return { checks };
  }
};
export { MCP_SERVERS };
