// Concierge goal interview: ask what the user wants to do (plain English),
// map it to the right plugins behind the scenes — they never see plugin jargon.
// CORE is always installed; goals only add relevant OPTIONAL plugins on top.

export const GOALS = [
  { value: 'build',    label: 'Build websites & apps',        extras: ['gh-cli', 'code-review'] },
  { value: 'write',    label: 'Write, research & take notes', extras: ['elements-of-style', 'private-journal-mcp', 'obsidian'] },
  { value: 'automate', label: 'Automate repetitive tasks',    extras: ['gh-cli'] },
  { value: 'explore',  label: "Just exploring / not sure yet", extras: [] },
];

// goalValues: string[] of chosen GOALS.value
// Returns the plugin objects to install (CORE + the OPTIONAL extras implied by the goals).
export function pluginsForGoals(goalValues, CORE, OPTIONAL) {
  const wanted = new Set();
  for (const g of GOALS) {
    if (goalValues.includes(g.value)) g.extras.forEach(e => wanted.add(e));
  }
  const extras = OPTIONAL.filter(p => p.available && wanted.has(p.name));
  return [...CORE, ...extras];
}
