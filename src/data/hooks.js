export function sessionStartHook(os) {
  const command = os === 'windows'
    ? `powershell -NoProfile -Command "Write-Output ('Today: ' + (Get-Date -Format yyyy-MM-dd)); git rev-parse --abbrev-ref HEAD 2>$null"`
    : `sh -c 'echo "Today: $(date +%Y-%m-%d)"; git rev-parse --abbrev-ref HEAD 2>/dev/null'`;
  return { SessionStart: [{ hooks: [{ type: 'command', command }] }] };
}

export function ferrariAdvisorHook(hooksDir, os) {
  const scriptPath = os === 'windows'
    ? `${hooksDir}\\ferrari-advisor.cjs`.replace(/\//g, '\\')
    : `${hooksDir}/ferrari-advisor.cjs`;
  const command = os === 'windows'
    ? `cmd /c node "${scriptPath}"`
    : `node "${scriptPath}"`;
  return { UserPromptSubmit: [{ hooks: [{ type: 'command', command, timeout: 5000 }] }] };
}

export function ferrariAdvisorScript() {
  return `'use strict';
// Ferrari Advisor — fires on UserPromptSubmit, detects task type, nudges toward right tool
const readline = require('readline');

const FERRARIS = [
  {
    trigger: /\\b(build|create|implement|new project|new feature|prd|spec|from scratch|ship|generate.*app|make.*app)\\b/i,
    advice: 'FERRARI: Build task → CORRECT ORDER: (1) superpowers:brainstorming to explore, (2) superpowers:writing-plans for human-approved spec, (3) THEN loki-mode start ./plan.md for autonomous execution. Loki alone drifts on ambiguous requirements — superpowers locks the spec first.',
  },
  {
    trigger: /\\b(debug|bug|error|broken|not working|failing|crash|exception|traceback|undefined|null pointer)\\b/i,
    advice: 'FERRARI: Debug task → invoke debug-buttercup skill first (systematic root cause protocol). /debug-buttercup',
  },
  {
    trigger: /\\b(find|search|look for|where is|which file|what is|how does|summarize|tell me about|explain)\\b/i,
    advice: 'FERRARI: Search/lookup task → use QMD semantic search first (not Grep/Read). mcp__qmd__query with your question.',
  },
  {
    trigger: /\\b(review (this )?(code|pr|diff|change)|check (for )?(security|vuln|risk)|before (merging?|committing?|pushing?))\\b/i,
    advice: 'FERRARI: Code review task → use differential-review skill for adversarial security analysis on diffs. /differential-review',
  },
  {
    trigger: /\\b(parallel|batch|multiple (files?|tasks?)|at once|all (of them|channels?|items?)|simultaneously)\\b/i,
    advice: 'FERRARI: Parallel/batch task → spawn multiple agents via swarm-orchestration skill instead of sequential execution.',
  },
  {
    trigger: /\\b(last session|previous session|continue from|pick up|where were we|remember|context|save state)\\b/i,
    advice: 'FERRARI: Continuity task → run context-restore skill to load prior session state, or context-save at session end.',
  },
];

async function main() {
  const rl = readline.createInterface({ input: process.stdin });
  let inputData = '';
  for await (const line of rl) inputData += line + '\\n';
  let hookData = {};
  try { hookData = JSON.parse(inputData); } catch {}
  const prompt = (hookData.prompt || '').toLowerCase();
  if (!prompt) process.exit(0);
  const hits = FERRARIS.filter(f => f.trigger.test(prompt));
  if (!hits.length) process.exit(0);
  const advice = hits.map(h => h.advice).join('\\n\\n');
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: '\\n[FERRARI ADVISOR — use the right tool]\\n' + advice,
    }
  }));
}
main().catch(() => process.exit(0));
`;
}
