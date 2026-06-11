export async function runWizard(steps, ctx, { decide, ui }) {
  ui.intro('claude-onboard');
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    ui.log.step(`${step.title}: ${step.explain(ctx.env)}`);

    // prompt() may merge answers; UI layer supplies real prompts, default merges step defaults
    const answers = await step.prompt(ctx);
    Object.assign(ctx.answers, answers);

    let res = await step.apply(ctx);
    while (!res.ok) {
      if (i === 0) { ui.log.error(res.error); ui.outro('Cannot continue.'); return { ...ctx, aborted: true }; }
      const choice = await decide(step, res.error);          // 'retry' | 'skip' | 'abort'
      if (choice === 'retry') { res = await step.apply(ctx); continue; }
      if (choice === 'abort') { ui.outro('Aborted.'); return { ...ctx, aborted: true }; }
      ui.log.warn(`Skipped "${step.title}" — ${res.error || 'unknown error'}`);
      break; // skip
    }

    if (res.ok) {
      const v = await step.verify(ctx);
      ctx.results[step.id] = v;
    }
  }
  ui.outro('Done.');
  return { ...ctx, aborted: false };
}
