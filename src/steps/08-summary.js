export function renderSummary(results) {
  const lines = [];
  let allPass = true;
  for (const [step, res] of Object.entries(results)) {
    for (const c of (res.checks || [])) {
      const mark = c.pass ? '✓' : '✗';
      if (!c.pass) allPass = false;
      lines.push(`${mark} [${step}] ${c.name} — ${c.proof}`);
    }
  }
  lines.push('');
  lines.push(allPass ? 'All steps verified.' : 'Some steps need attention (see ✗ above).');
  return lines.join('\n');
}

export default {
  id: 'summary',
  title: 'Summary',
  async inspect() { return {}; },
  explain() { return 'Here is everything we set up, with proof.'; },
  async prompt() { return {}; },
  async apply(ctx) { return { ok: true, changes: [renderSummary(ctx.results)] }; },
  async verify() { return { checks: [] }; }
};
