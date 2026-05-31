import * as p from '@clack/prompts';

export const ui = {
  intro: (t) => p.intro(t),
  outro: (t) => p.outro(t),
  note: (t, title) => p.note(t, title),
  log: { step: (t) => p.log.step(t), error: (t) => p.log.error(t), success: (t) => p.log.success(t) }
};

export async function decide(step, error) {
  ui.log.error(`${step.title} failed: ${error}`);
  const choice = await p.select({
    message: 'What now?',
    options: [
      { value: 'retry', label: 'Retry this step' },
      { value: 'skip', label: 'Skip and continue' },
      { value: 'abort', label: 'Stop the wizard' }
    ]
  });
  return p.isCancel(choice) ? 'abort' : choice;
}
