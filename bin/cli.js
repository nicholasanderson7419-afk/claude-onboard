#!/usr/bin/env node
import { homedir } from 'node:os';
import { run } from '../src/lib/exec.js';
import { buildContext } from '../src/context.js';
import { runWizard } from '../src/wizard.js';
import { ui, decide } from '../src/ui.js';
import { clackIo } from '../src/io.js';

import claudeCheck from '../src/steps/00-claude-check.js';
import prereqs from '../src/steps/02-prereqs.js';
import plugins from '../src/steps/03-plugins.js';
import claudemd from '../src/steps/04-claudemd.js';
import hooks from '../src/steps/05-hooks.js';
import secondbrain from '../src/steps/06-secondbrain.js';
import northstar from '../src/steps/06b-northstar.js';
import qmd from '../src/steps/06c-qmd.js';
import mcpServers from '../src/steps/06d-mcp.js';
import skills from '../src/steps/06e-skills.js';
import loops from '../src/steps/07-loops.js';
import summary, { renderSummary } from '../src/steps/08-summary.js';

// Node version guard (friendly, no stack trace)
const major = Number(process.versions.node.split('.')[0]);
if (major < 18) {
  console.error(`claude-onboard needs Node 18 or newer. You have ${process.versions.node}. Update Node, then re-run.`);
  process.exit(1);
}

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

const express = process.argv.includes('--express');
const guided = process.argv.includes('--guided');
const pIdx = process.argv.indexOf('--project');
const projectRoot = pIdx >= 0 ? process.argv[pIdx + 1] : null;
// No interactive prompts without a real TTY: clack renders but its promise never
// settles on a closed/piped stdin (unsettled top-level await -> node exits mid-wizard).
const hasTty = Boolean(process.stdin.isTTY && process.stdout.isTTY);
const ctx = await buildContext({ platform: process.platform, home: homedir(), stamp: stamp(), today: today(), run, io: (express || !hasTty) ? null : clackIo(), express, guided, projectRoot });
const steps = [claudeCheck, prereqs, plugins, claudemd, hooks, secondbrain, northstar, qmd, mcpServers, skills, loops, summary];

try {
  const out = await runWizard(steps, ctx, { decide: (express || guided) ? async () => 'skip' : decide, ui });
  if (!out.aborted) ui.note(renderSummary(out.results), 'Setup summary');
} catch (e) {
  ui.log.error(`Something went wrong: ${e && e.message ? e.message : e}`);
  process.exit(1);
}
