// Concierge goal interview: ask what the user wants to do (plain English),
// map it to the right plugins / MCP servers / skills behind the scenes —
// they never see the jargon. CORE plugins are always installed; goals only
// add relevant OPTIONAL plugins, MCP servers, and skills on top.
//
// Skill tokens (resolved by step 06e): 'llm-council' (git-clone skill),
// 'om-commands' (the om-* second-brain command suite).

export const GOALS = [
  { value: 'build',    label: 'Build websites & apps',         extras: ['gh-cli', 'code-review'],                                mcp: ['playwright'],           skills: ['llm-council'] },
  { value: 'write',    label: 'Write, research & take notes',  extras: ['elements-of-style', 'private-journal-mcp', 'obsidian'], mcp: [],                       skills: ['llm-council', 'om-commands'] },
  { value: 'automate', label: 'Automate repetitive tasks',     extras: ['gh-cli'],                                               mcp: ['ruflo', 'claude-flow'], skills: [] },
  { value: 'explore',  label: "Just exploring / not sure yet", extras: [],                                                       mcp: [],                       skills: [] },
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

// Returns the MCP server objects implied by the chosen goals (available only).
export function mcpForGoals(goalValues, MCP_SERVERS) {
  const wanted = new Set();
  for (const g of GOALS) {
    if (goalValues.includes(g.value)) (g.mcp || []).forEach(m => wanted.add(m));
  }
  return MCP_SERVERS.filter(s => s.available && wanted.has(s.name));
}

// Returns a Set of skill tokens implied by the chosen goals.
export function skillsForGoals(goalValues) {
  const wanted = new Set();
  for (const g of GOALS) {
    if (goalValues.includes(g.value)) (g.skills || []).forEach(s => wanted.add(s));
  }
  return wanted;
}
