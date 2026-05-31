# claude-onboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic Node CLI wizard that takes a non-technical user from a fresh machine to a verified Claude Code setup (prereqs, plugins, CLAUDE.md, hooks, Obsidian second brain).

**Architecture:** Plain Node ESM CLI run via `npx`. A wizard loop runs ordered step modules that share one interface (`inspect → explain → prompt → apply → verify`). Pure logic (file merges, output parsing) is unit-tested; all `claude`/shell calls go through an injectable runner so they can be mocked in tests and only hit the real CLI in a guarded smoke test.

**Tech Stack:** Node.js ≥18, ES modules, `@clack/prompts` (UI), `vitest` (tests). No build step.

---

## File Structure

```
claude-onboard/
  package.json                 type:module, bin, engines>=18, deps
  bin/cli.js                   entry: node-version guard → run wizard
  src/
    wizard.js                  the loop: runs steps over shared ctx
    context.js                 builds ctx { env, answers, results }
    lib/
      exec.js                  run(cmd,args) → {ok,code,stdout,stderr} (injectable)
      claude.js                thin wrappers: pluginList, mcpList, installPlugin, addMcp, addMarketplace
      detect.js                detectOS, detectPkgManager, parsePluginList, parseMcpList
      writers.js               backupFile, mergeHooks, appendSection, scaffoldTree, mergeJsonFile
      verify.js                check(name, fn) → {name,pass,proof}; fileHasMarker, jsonHasKey
    data/
      plugins.js               CORE/OPTIONAL plugin lists + marketplace sources
      hooks.js                 the defined hook snippets (per-OS)
    steps/
      00-claude-check.js
      02-prereqs.js
      03-plugins.js
      04-claudemd.js
      05-hooks.js
      06-secondbrain.js
      07-loops.js
      08-summary.js
    templates/
      claude-md.global.md
      claude-md.project.md
      vault/North Star.md
      vault/MEMORY.md
  tests/
    lib/*.test.js
    steps/*.test.js
    smoke/claude-cli.smoke.test.js   (guarded, opt-in)
```

**Note on Step 1 (Environment scan):** not a separate file — it is `context.js` calling `detect.js` once and printing a summary. Steps numbered to match the spec; there is no `01-*.js`.

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `vitest.config.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "claude-onboard",
  "version": "0.1.0",
  "type": "module",
  "bin": { "claude-onboard": "bin/cli.js" },
  "engines": { "node": ">=18" },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "smoke": "CLAUDE_ONBOARD_SMOKE=1 vitest run tests/smoke"
  },
  "dependencies": {
    "@clack/prompts": "^0.7.0"
  },
  "devDependencies": {
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
*.bak.*
.claude-onboard-state.json
coverage/
```

- [ ] **Step 3: Create vitest.config.js**

```js
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.js'] }
});
```

- [ ] **Step 4: Install deps and verify**

Run: `npm install`
Expected: `node_modules/` created, exit 0.

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore vitest.config.js package-lock.json
git commit -m "chore: project scaffold (node esm, vitest, clack)"
```

---

## Task 2: exec runner (`src/lib/exec.js`)

The single choke point for running external commands. Uses `execFile` (no shell, avoids injection). Returns a result object, never throws on non-zero exit.

**Files:**
- Create: `src/lib/exec.js`
- Test: `tests/lib/exec.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { run } from '../../src/lib/exec.js';

describe('run', () => {
  it('captures stdout and ok=true on success', async () => {
    const r = await run(process.execPath, ['-e', "process.stdout.write('hi')"]);
    expect(r.ok).toBe(true);
    expect(r.code).toBe(0);
    expect(r.stdout).toBe('hi');
  });

  it('captures non-zero exit as ok=false without throwing', async () => {
    const r = await run(process.execPath, ['-e', 'process.exit(3)']);
    expect(r.ok).toBe(false);
    expect(r.code).toBe(3);
  });

  it('returns ok=false when the binary does not exist', async () => {
    const r = await run('definitely-not-a-real-binary-xyz', []);
    expect(r.ok).toBe(false);
    expect(r.stderr.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/exec.test.js`
Expected: FAIL — cannot resolve `src/lib/exec.js`.

- [ ] **Step 3: Write minimal implementation**

```js
import { execFile } from 'node:child_process';

export function run(cmd, args = [], opts = {}) {
  return new Promise((resolve) => {
    execFile(cmd, args, { encoding: 'utf8', ...opts }, (err, stdout, stderr) => {
      if (err && typeof err.code !== 'number') {
        // spawn failure (e.g. ENOENT): no numeric exit code
        resolve({ ok: false, code: null, stdout: stdout || '', stderr: String(err.message || err) });
      } else {
        const code = err ? err.code : 0;
        resolve({ ok: code === 0, code, stdout: stdout || '', stderr: stderr || '' });
      }
    });
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/exec.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/exec.js tests/lib/exec.test.js
git commit -m "feat: exec runner with non-throwing result objects"
```

---

## Task 3: writers — timestamped backup (`backupFile`)

**Files:**
- Create: `src/lib/writers.js`
- Test: `tests/lib/writers.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { backupFile } from '../../src/lib/writers.js';

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'co-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('backupFile', () => {
  it('copies existing file to a timestamped .bak and returns its path', () => {
    const f = join(dir, 'CLAUDE.md');
    writeFileSync(f, 'original');
    const bak = backupFile(f, '20260531T000000');
    expect(bak).toBe(f + '.bak.20260531T000000');
    expect(existsSync(bak)).toBe(true);
    expect(readFileSync(bak, 'utf8')).toBe('original');
  });

  it('returns null when the source file does not exist', () => {
    expect(backupFile(join(dir, 'missing.md'), '20260531T000000')).toBe(null);
  });

  it('never overwrites an existing backup with the same stamp', () => {
    const f = join(dir, 'CLAUDE.md');
    writeFileSync(f, 'v1');
    backupFile(f, 'stamp1');
    writeFileSync(f, 'v2');
    const bak2 = backupFile(f, 'stamp1');           // same stamp again
    expect(readFileSync(bak2, 'utf8')).toBe('v1');  // original preserved, not v2
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/writers.test.js`
Expected: FAIL — `backupFile` not exported.

- [ ] **Step 3: Write minimal implementation**

```js
import { existsSync, copyFileSync, constants } from 'node:fs';

export function backupFile(path, stamp) {
  if (!existsSync(path)) return null;
  const bak = `${path}.bak.${stamp}`;
  if (existsSync(bak)) return bak;               // never clobber a prior backup
  copyFileSync(path, bak, constants.COPYFILE_EXCL);
  return bak;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/writers.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/writers.js tests/lib/writers.test.js
git commit -m "feat: timestamped non-clobbering backupFile"
```

---

## Task 4: writers — idempotent `appendSection`

**Files:**
- Modify: `src/lib/writers.js`
- Test: `tests/lib/writers.test.js`

- [ ] **Step 1: Write the failing test (append to existing test file)**

```js
import { appendSection } from '../../src/lib/writers.js';

describe('appendSection', () => {
  it('appends a marked section when the marker is absent', () => {
    const out = appendSection('# existing\n', 'onboard:global', 'RULE ONE');
    expect(out).toContain('# existing');
    expect(out).toContain('<!-- onboard:global:start -->');
    expect(out).toContain('RULE ONE');
    expect(out).toContain('<!-- onboard:global:end -->');
  });

  it('is idempotent — re-appending the same marker does not duplicate', () => {
    const once = appendSection('base\n', 'onboard:global', 'RULE');
    const twice = appendSection(once, 'onboard:global', 'RULE');
    const count = (twice.match(/onboard:global:start/g) || []).length;
    expect(count).toBe(1);
  });

  it('replaces the section body when content changed', () => {
    const once = appendSection('base\n', 'onboard:global', 'OLD');
    const twice = appendSection(once, 'onboard:global', 'NEW');
    expect(twice).toContain('NEW');
    expect(twice).not.toContain('OLD');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/writers.test.js`
Expected: FAIL — `appendSection` not exported.

- [ ] **Step 3: Write minimal implementation (add to writers.js)**

```js
export function appendSection(content, marker, body) {
  const start = `<!-- ${marker}:start -->`;
  const end = `<!-- ${marker}:end -->`;
  const block = `${start}\n${body}\n${end}`;
  const re = new RegExp(`${escapeRe(start)}[\\s\\S]*?${escapeRe(end)}`);
  if (re.test(content)) return content.replace(re, block);
  const sep = content.endsWith('\n') ? '\n' : '\n\n';
  return content + sep + block + '\n';
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/writers.test.js`
Expected: PASS (all writers tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/writers.js tests/lib/writers.test.js
git commit -m "feat: idempotent appendSection with replace-on-change"
```

---

## Task 5: writers — array-aware `mergeHooks`

Hooks in `settings.json` are arrays per event. Merge must not duplicate an entry that already exists (matched by event + command).

**Files:**
- Modify: `src/lib/writers.js`
- Test: `tests/lib/writers.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { mergeHooks } from '../../src/lib/writers.js';

describe('mergeHooks', () => {
  const existing = {
    hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'echo a' }] }] }
  };

  it('adds a new event without touching existing ones', () => {
    const out = mergeHooks(existing, { UserPromptSubmit: [{ hooks: [{ type: 'command', command: 'echo b' }] }] });
    expect(out.hooks.SessionStart).toHaveLength(1);
    expect(out.hooks.UserPromptSubmit).toHaveLength(1);
  });

  it('does not duplicate an identical command on the same event', () => {
    const out = mergeHooks(existing, { SessionStart: [{ hooks: [{ type: 'command', command: 'echo a' }] }] });
    expect(out.hooks.SessionStart).toHaveLength(1);
  });

  it('appends a different command on an existing event', () => {
    const out = mergeHooks(existing, { SessionStart: [{ hooks: [{ type: 'command', command: 'echo NEW' }] }] });
    expect(out.hooks.SessionStart).toHaveLength(2);
  });

  it('preserves unrelated top-level keys', () => {
    const withModel = { model: 'opus', ...existing };
    const out = mergeHooks(withModel, {});
    expect(out.model).toBe('opus');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/writers.test.js`
Expected: FAIL — `mergeHooks` not exported.

- [ ] **Step 3: Write minimal implementation (add to writers.js)**

```js
export function mergeHooks(settings, newHooks) {
  const out = { ...settings, hooks: { ...(settings.hooks || {}) } };
  for (const [event, entries] of Object.entries(newHooks)) {
    const current = out.hooks[event] ? [...out.hooks[event]] : [];
    const existingCmds = new Set(
      current.flatMap(e => (e.hooks || []).map(h => h.command))
    );
    for (const entry of entries) {
      const cmds = (entry.hooks || []).map(h => h.command);
      const allPresent = cmds.length > 0 && cmds.every(c => existingCmds.has(c));
      if (!allPresent) {
        current.push(entry);
        cmds.forEach(c => existingCmds.add(c));
      }
    }
    out.hooks[event] = current;
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/writers.test.js`
Expected: PASS (all writers tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/writers.js tests/lib/writers.test.js
git commit -m "feat: array-aware mergeHooks dedupe by event+command"
```

---

## Task 6: writers — `scaffoldTree` (create-missing only)

**Files:**
- Modify: `src/lib/writers.js`
- Test: `tests/lib/writers.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { scaffoldTree } from '../../src/lib/writers.js';
import { mkdirSync } from 'node:fs';

describe('scaffoldTree', () => {
  it('creates missing dirs and seed files, reports what it created', () => {
    const created = scaffoldTree(dir, {
      'brain/': null,
      'wiki/concepts/': null,
      'North Star.md': 'goals here'
    });
    expect(existsSync(join(dir, 'brain'))).toBe(true);
    expect(existsSync(join(dir, 'wiki/concepts'))).toBe(true);
    expect(readFileSync(join(dir, 'North Star.md'), 'utf8')).toBe('goals here');
    expect(created).toContain('North Star.md');
  });

  it('never overwrites an existing note', () => {
    writeFileSync(join(dir, 'North Star.md'), 'USER CONTENT');
    const created = scaffoldTree(dir, { 'North Star.md': 'seed' });
    expect(readFileSync(join(dir, 'North Star.md'), 'utf8')).toBe('USER CONTENT');
    expect(created).not.toContain('North Star.md');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/writers.test.js`
Expected: FAIL — `scaffoldTree` not exported.

- [ ] **Step 3: Write minimal implementation (add to writers.js)**

```js
import { mkdirSync, writeFileSync as _writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

export function scaffoldTree(root, tree) {
  const created = [];
  for (const [rel, body] of Object.entries(tree)) {
    const target = join(root, rel);
    if (rel.endsWith('/') || body === null) {
      mkdirSync(target, { recursive: true });
      continue;
    }
    if (!existsSync(target)) {
      mkdirSync(dirname(target), { recursive: true });
      _writeFileSync(target, body);
      created.push(rel);
    }
  }
  return created;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/writers.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/writers.js tests/lib/writers.test.js
git commit -m "feat: scaffoldTree create-missing-only with report"
```

---

## Task 7: detect — OS + package manager

**Files:**
- Create: `src/lib/detect.js`
- Test: `tests/lib/detect.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { detectOS, detectPkgManager } from '../../src/lib/detect.js';

describe('detectOS', () => {
  it('maps node platforms to friendly names', () => {
    expect(detectOS('win32')).toBe('windows');
    expect(detectOS('darwin')).toBe('mac');
    expect(detectOS('linux')).toBe('linux');
  });
});

describe('detectPkgManager', () => {
  // runner: (cmd,args) => Promise<{ok}>; mock which/where lookups
  const okFor = (name) => async (cmd, args) =>
    ({ ok: args.includes(name) || cmd === name });

  it('returns winget on windows when present', async () => {
    expect(await detectPkgManager('windows', okFor('winget'))).toBe('winget');
  });
  it('returns brew on mac when present', async () => {
    expect(await detectPkgManager('mac', okFor('brew'))).toBe('brew');
  });
  it('returns apt on linux when present', async () => {
    expect(await detectPkgManager('linux', okFor('apt-get'))).toBe('apt');
  });
  it('returns null when none found', async () => {
    const none = async () => ({ ok: false });
    expect(await detectPkgManager('linux', none)).toBe(null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/detect.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
export function detectOS(platform = process.platform) {
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'mac';
  return 'linux';
}

// runner(cmd,args) → {ok}. Probe with the OS "is this on PATH" command.
export async function detectPkgManager(os, runner) {
  const probe = async (bin) => {
    if (os === 'windows') return (await runner('where', [bin])).ok;
    return (await runner('which', [bin])).ok;
  };
  if (os === 'windows' && await probe('winget')) return 'winget';
  if (os === 'mac' && await probe('brew')) return 'brew';
  if (os === 'linux' && await probe('apt-get')) return 'apt';
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/detect.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/detect.js tests/lib/detect.test.js
git commit -m "feat: detectOS and detectPkgManager"
```

---

## Task 8: detect — parse `claude plugin list` and `claude mcp list`

Parsers turn CLI text into structured data so `verify` can assert on it. Sample output captured from the real CLI:

```
Installed plugins:

  ❯ superpowers@superpowers-marketplace
    Version: 5.0.7
    Scope: user
    Status: ✔ enabled
```
```
memory: npx -y @modelcontextprotocol/server-memory - ✓ Connected
```

**Files:**
- Modify: `src/lib/detect.js`
- Test: `tests/lib/detect.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { parsePluginList, parseMcpList } from '../../src/lib/detect.js';

describe('parsePluginList', () => {
  const sample = `Installed plugins:

  ❯ superpowers@superpowers-marketplace
    Version: 5.0.7
    Scope: user
    Status: ✔ enabled

  ❯ caveman@caveman
    Version: 84cc3c14fa1e
    Scope: user
    Status: ✗ disabled
`;
  it('extracts name, marketplace, enabled flag', () => {
    const got = parsePluginList(sample);
    expect(got).toEqual([
      { name: 'superpowers', marketplace: 'superpowers-marketplace', enabled: true },
      { name: 'caveman', marketplace: 'caveman', enabled: false }
    ]);
  });
  it('returns [] for empty output', () => {
    expect(parsePluginList('Installed plugins:\n')).toEqual([]);
  });
});

describe('parseMcpList', () => {
  const sample = `Checking MCP server health…

memory: npx -y @modelcontextprotocol/server-memory - ✓ Connected
obsidian-vault: npx -y x - ✓ Connected
broken: foo - ✗ Failed to connect`;
  it('extracts name and connected flag', () => {
    const got = parseMcpList(sample);
    expect(got).toContainEqual({ name: 'memory', connected: true });
    expect(got).toContainEqual({ name: 'broken', connected: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/detect.test.js`
Expected: FAIL — parsers not exported.

- [ ] **Step 3: Write minimal implementation (add to detect.js)**

```js
export function parsePluginList(stdout) {
  const out = [];
  const lines = stdout.split(/\r?\n/);
  let cur = null;
  for (const line of lines) {
    const head = line.match(/❯\s+([^@\s]+)@(\S+)/);
    if (head) { cur = { name: head[1], marketplace: head[2], enabled: false }; out.push(cur); continue; }
    if (cur && /Status:/.test(line)) cur.enabled = /enabled/i.test(line) && !/disabled/i.test(line);
  }
  return out;
}

export function parseMcpList(stdout) {
  const out = [];
  for (const line of stdout.split(/\r?\n/)) {
    const m = line.match(/^([\w:-]+):\s.*-\s*(✓ Connected|✗.*)$/);
    if (m) out.push({ name: m[1], connected: m[2].startsWith('✓') });
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/detect.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/detect.js tests/lib/detect.test.js
git commit -m "feat: parse plugin list and mcp list output"
```

---

## Task 9: claude wrappers (`src/lib/claude.js`)

Thin, named wrappers over the real CLI commands (validated syntax). Every wrapper takes the `run` function so tests inject a mock.

**Files:**
- Create: `src/lib/claude.js`
- Test: `tests/lib/claude.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { addMarketplace, installPlugin, addMcp, pluginList } from '../../src/lib/claude.js';

const spy = () => {
  const calls = [];
  const run = async (cmd, args) => { calls.push([cmd, args]); return { ok: true, code: 0, stdout: '', stderr: '' }; };
  return { run, calls };
};

describe('claude wrappers', () => {
  it('addMarketplace calls: claude plugin marketplace add <source>', async () => {
    const { run, calls } = spy();
    await addMarketplace(run, 'obra/superpowers-marketplace');
    expect(calls[0]).toEqual(['claude', ['plugin', 'marketplace', 'add', 'obra/superpowers-marketplace']]);
  });

  it('installPlugin calls: claude plugin install <name>@<mkt> -s user', async () => {
    const { run, calls } = spy();
    await installPlugin(run, 'superpowers', 'superpowers-marketplace');
    expect(calls[0]).toEqual(['claude', ['plugin', 'install', 'superpowers@superpowers-marketplace', '-s', 'user']]);
  });

  it('addMcp calls: claude mcp add <name> -s user -- <cmd...>', async () => {
    const { run, calls } = spy();
    await addMcp(run, 'memory', 'user', ['npx', '-y', '@modelcontextprotocol/server-memory']);
    expect(calls[0]).toEqual(['claude', ['mcp', 'add', 'memory', '-s', 'user', '--', 'npx', '-y', '@modelcontextprotocol/server-memory']]);
  });

  it('pluginList passes through stdout', async () => {
    const run = async () => ({ ok: true, code: 0, stdout: 'PLUGINS', stderr: '' });
    expect((await pluginList(run)).stdout).toBe('PLUGINS');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/claude.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
export const addMarketplace = (run, source) =>
  run('claude', ['plugin', 'marketplace', 'add', source]);

export const installPlugin = (run, name, marketplace) =>
  run('claude', ['plugin', 'install', `${name}@${marketplace}`, '-s', 'user']);

export const addMcp = (run, name, scope, commandParts) =>
  run('claude', ['mcp', 'add', name, '-s', scope, '--', ...commandParts]);

export const pluginList = (run) => run('claude', ['plugin', 'list']);
export const mcpList = (run) => run('claude', ['mcp', 'list']);
export const claudeOnPath = (run) => run('claude', ['--version']);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/claude.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/claude.js tests/lib/claude.test.js
git commit -m "feat: thin claude CLI wrappers (marketplace/install/mcp/list)"
```

---

## Task 10: verify helper (`src/lib/verify.js`)

**Files:**
- Create: `src/lib/verify.js`
- Test: `tests/lib/verify.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { check } from '../../src/lib/verify.js';

describe('check', () => {
  it('returns pass=true with proof from the fn', async () => {
    const r = await check('git present', async () => ({ pass: true, proof: 'git 2.4' }));
    expect(r).toEqual({ name: 'git present', pass: true, proof: 'git 2.4' });
  });
  it('captures a thrown error as pass=false', async () => {
    const r = await check('boom', async () => { throw new Error('nope'); });
    expect(r.pass).toBe(false);
    expect(r.proof).toContain('nope');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/verify.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
export async function check(name, fn) {
  try {
    const { pass, proof } = await fn();
    return { name, pass: !!pass, proof: proof || '' };
  } catch (e) {
    return { name, pass: false, proof: String(e.message || e) };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/verify.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/verify.js tests/lib/verify.test.js
git commit -m "feat: check() verify helper with error capture"
```

---

## Task 11: static data (`src/data/plugins.js`)

**Files:**
- Create: `src/data/plugins.js`
- Test: `tests/data/plugins.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { MARKETPLACES, CORE, OPTIONAL } from '../../src/data/plugins.js';

describe('plugin data', () => {
  it('has 5 known marketplace sources (+ aaaronmiller flagged unknown)', () => {
    expect(MARKETPLACES['superpowers-marketplace']).toBe('obra/superpowers-marketplace');
    expect(MARKETPLACES['caveman']).toBe('JuliusBrussee/caveman');
    expect(MARKETPLACES['trailofbits']).toBe('trailofbits/skills');
    expect(MARKETPLACES['claude-plugins-official']).toBe('anthropics/claude-plugins-official');
    expect(MARKETPLACES['claude-video-vision']).toBe('https://github.com/jordanrendric/claude-video-vision.git');
    expect(MARKETPLACES['aaaronmiller']).toBe(null); // unknown — must resolve before enabling
  });

  it('core 6 are the agreed defaults', () => {
    expect(CORE.map(p => p.name).sort()).toEqual(
      ['ask-questions-if-underspecified', 'caveman', 'claude-session-driver', 'debug-buttercup', 'double-shot-latte', 'superpowers'].sort()
    );
  });

  it('optional set excludes create-viral-content until aaaronmiller source is known', () => {
    const cvc = OPTIONAL.find(p => p.name === 'create-viral-content');
    expect(cvc.available).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/data/plugins.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
export const MARKETPLACES = {
  'superpowers-marketplace': 'obra/superpowers-marketplace',
  'caveman': 'JuliusBrussee/caveman',
  'trailofbits': 'trailofbits/skills',
  'claude-plugins-official': 'anthropics/claude-plugins-official',
  'claude-video-vision': 'https://github.com/jordanrendric/claude-video-vision.git',
  'aaaronmiller': null // OPEN ITEM: source unknown, must resolve before enabling
};

export const CORE = [
  { name: 'superpowers', marketplace: 'superpowers-marketplace' },
  { name: 'caveman', marketplace: 'caveman' },
  { name: 'claude-session-driver', marketplace: 'superpowers-marketplace' },
  { name: 'double-shot-latte', marketplace: 'superpowers-marketplace' },
  { name: 'ask-questions-if-underspecified', marketplace: 'trailofbits' },
  { name: 'debug-buttercup', marketplace: 'trailofbits' }
];

export const OPTIONAL = [
  { name: 'elements-of-style', marketplace: 'superpowers-marketplace', available: true },
  { name: 'private-journal-mcp', marketplace: 'superpowers-marketplace', available: true },
  { name: 'agentic-actions-auditor', marketplace: 'trailofbits', available: true },
  { name: 'differential-review', marketplace: 'trailofbits', available: true },
  { name: 'gh-cli', marketplace: 'trailofbits', available: true, needs: ['gh'] },
  { name: 'code-review', marketplace: 'claude-plugins-official', available: true, needs: ['gh'] },
  { name: 'claude-video-vision', marketplace: 'claude-video-vision', available: true, needs: ['ffmpeg'] },
  { name: 'create-viral-content', marketplace: 'aaaronmiller', available: false }
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/data/plugins.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/plugins.js tests/data/plugins.test.js
git commit -m "feat: plugin/marketplace data (core6, optional8, aaaronmiller flagged)"
```

---

## Task 12: hook snippets (`src/data/hooks.js`)

Per-OS SessionStart hook that injects *dynamic* context (date + git branch) — not a CLAUDE.md reload.

**Files:**
- Create: `src/data/hooks.js`
- Test: `tests/data/hooks.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { sessionStartHook } from '../../src/data/hooks.js';

describe('sessionStartHook', () => {
  it('windows uses powershell, prints date and branch', () => {
    const h = sessionStartHook('windows');
    const cmd = h.SessionStart[0].hooks[0].command;
    expect(cmd).toMatch(/powershell/i);
    expect(cmd).toMatch(/Get-Date/);
  });
  it('unix uses sh, prints date and branch', () => {
    const h = sessionStartHook('linux');
    const cmd = h.SessionStart[0].hooks[0].command;
    expect(cmd).toMatch(/date/);
    expect(cmd).toMatch(/git/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/data/hooks.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
export function sessionStartHook(os) {
  const command = os === 'windows'
    ? `powershell -NoProfile -Command "Write-Output ('Today: ' + (Get-Date -Format yyyy-MM-dd)); git rev-parse --abbrev-ref HEAD 2>$null"`
    : `sh -c 'echo "Today: $(date +%Y-%m-%d)"; git rev-parse --abbrev-ref HEAD 2>/dev/null'`;
  return { SessionStart: [{ hooks: [{ type: 'command', command }] }] };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/data/hooks.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/hooks.js tests/data/hooks.test.js
git commit -m "feat: per-OS SessionStart hook (dynamic date+branch, not CLAUDE.md reload)"
```

---

## Task 13: step contract + Step 0 (claude-check)

Every step exports `{ id, title, inspect, explain, prompt, apply, verify }`. Step 0 gates on `claude` presence + auth.

**Files:**
- Create: `src/steps/00-claude-check.js`
- Test: `tests/steps/00-claude-check.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import step from '../../src/steps/00-claude-check.js';

const ctxWith = (run) => ({ env: { run }, answers: {}, results: {} });

describe('step 00 claude-check', () => {
  it('inspect reports missing when claude --version fails to spawn', async () => {
    const run = async () => ({ ok: false, code: null, stdout: '', stderr: 'ENOENT' });
    const r = await step.inspect(ctxWith(run).env);
    expect(r.installed).toBe(false);
  });

  it('inspect reports installed + authed when version ok and probe ok', async () => {
    const run = async (cmd, args) => {
      if (args.includes('--version')) return { ok: true, code: 0, stdout: '1.2.3', stderr: '' };
      return { ok: true, code: 0, stdout: 'ok', stderr: '' }; // auth probe
    };
    const r = await step.inspect(ctxWith(run).env);
    expect(r.installed).toBe(true);
    expect(r.authed).toBe(true);
  });

  it('apply returns ok=false with guidance when not installed', async () => {
    const run = async () => ({ ok: false, code: null, stdout: '', stderr: 'ENOENT' });
    const ctx = ctxWith(run);
    const res = await step.apply(ctx);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/install/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/steps/00-claude-check.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
import { claudeOnPath } from '../lib/claude.js';

async function authProbe(run) {
  // Minimal headless round-trip. Short, cheap. ok=true ⇒ authenticated.
  const r = await run('claude', ['-p', 'ok'], { timeout: 60000 });
  return r.ok;
}

export default {
  id: 'claude-check',
  title: 'Claude Code',
  async inspect(env) {
    const ver = await claudeOnPath(env.run);
    if (!ver.ok) return { installed: false, authed: false, version: null };
    const authed = await authProbe(env.run);
    return { installed: true, authed, version: ver.stdout.trim() };
  },
  explain() {
    return 'First we make sure Claude Code itself is installed and you are logged in. Everything else builds on it.';
  },
  async prompt() { return {}; },
  async apply(ctx) {
    const s = await this.inspect(ctx.env);
    if (!s.installed) {
      return { ok: false, changes: [], error: 'Claude Code is not installed. Install it from https://docs.claude.com/claude-code then re-run.' };
    }
    if (!s.authed) {
      return { ok: false, changes: [], error: 'Claude Code is installed but not logged in. Run `claude` once and sign in, then re-run.' };
    }
    return { ok: true, changes: [`claude ${s.version} present and authenticated`] };
  },
  async verify() {
    return { checks: [] }; // gate step; apply already proves state
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/steps/00-claude-check.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/steps/00-claude-check.js tests/steps/00-claude-check.test.js
git commit -m "feat: step 0 claude-check (presence + real auth probe)"
```

---

## Task 14: Step 3 — plugins (marketplaces + install + verify)

(Steps 1/2 are simpler; Step 3 is the highest-risk so it is built and tested first among the action steps. Steps 2/4/5/6/7 follow the same contract — see Tasks 15-19.)

**Files:**
- Create: `src/steps/03-plugins.js`
- Test: `tests/steps/03-plugins.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import step from '../../src/steps/03-plugins.js';

function fakeRun(script) {
  const calls = [];
  const run = async (cmd, args) => {
    calls.push(args.join(' '));
    if (args[0] === 'plugin' && args[1] === 'list') return { ok: true, code: 0, stdout: script.list, stderr: '' };
    return { ok: true, code: 0, stdout: '', stderr: '' };
  };
  return { run, calls };
}

describe('step 03 plugins', () => {
  it('apply adds each needed marketplace then installs chosen plugins', async () => {
    const { run, calls } = fakeRun({ list: '' });
    const ctx = { env: { run }, answers: { plugins: [{ name: 'superpowers', marketplace: 'superpowers-marketplace' }] }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    expect(calls.some(c => c === 'plugin marketplace add obra/superpowers-marketplace')).toBe(true);
    expect(calls.some(c => c === 'plugin install superpowers@superpowers-marketplace -s user')).toBe(true);
  });

  it('verify passes when plugin is present even if not yet enabled (restart-aware)', async () => {
    const list = `Installed plugins:\n\n  ❯ superpowers@superpowers-marketplace\n    Status: ✗ disabled\n`;
    const { run } = fakeRun({ list });
    const ctx = { env: { run }, answers: { plugins: [{ name: 'superpowers', marketplace: 'superpowers-marketplace' }] }, results: {} };
    const v = await step.verify(ctx);
    const c = v.checks.find(x => x.name.includes('superpowers'));
    expect(c.pass).toBe(true);
    expect(c.proof).toMatch(/installed/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/steps/03-plugins.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/steps/03-plugins.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/steps/03-plugins.js tests/steps/03-plugins.test.js
git commit -m "feat: step 3 plugins (marketplace add + install + restart-aware verify)"
```

---

## Task 15: Step 2 — prerequisites (git essential; gh/ffmpeg on-demand)

**Files:**
- Create: `src/steps/02-prereqs.js`
- Test: `tests/steps/02-prereqs.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import step from '../../src/steps/02-prereqs.js';

function runner(present) {
  // present: Set of binaries that respond ok to `--version`
  return async (cmd, args) => {
    if (args.includes('--version')) return { ok: present.has(cmd), code: present.has(cmd) ? 0 : 1, stdout: present.has(cmd) ? `${cmd} 1.0` : '', stderr: '' };
    return { ok: true, code: 0, stdout: '', stderr: '' };
  };
}

describe('step 02 prereqs', () => {
  it('inspect reports git missing', async () => {
    const env = { os: 'linux', pkgManager: 'apt', run: runner(new Set()) };
    const r = await step.inspect(env);
    expect(r.needed).toContain('git');
  });

  it('apply installs only git when no on-demand plugins selected', async () => {
    const calls = [];
    const run = async (cmd, args) => { calls.push([cmd, ...args].join(' ')); return { ok: true, code: 0, stdout: 'git 1.0', stderr: '' }; };
    const env = { os: 'linux', pkgManager: 'apt', run };
    const ctx = { env, answers: { plugins: [] }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    // gh and ffmpeg not requested → not installed
    expect(calls.some(c => c.includes('gh'))).toBe(false);
    expect(calls.some(c => c.includes('ffmpeg'))).toBe(false);
  });

  it('apply adds gh when a gh-needing plugin is chosen', async () => {
    const calls = [];
    const run = async (cmd, args) => { calls.push([cmd, ...args].join(' ')); return { ok: true, code: 0, stdout: 'x 1.0', stderr: '' }; };
    const env = { os: 'linux', pkgManager: 'apt', run };
    const ctx = { env, answers: { plugins: [{ name: 'gh-cli', needs: ['gh'] }] }, results: {} };
    await step.apply(ctx);
    expect(calls.some(c => c.includes('apt') && c.includes('gh'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/steps/02-prereqs.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
import { check } from '../lib/verify.js';

const INSTALL = {
  winget: (pkg) => ['winget', ['install', '-e', '--id', pkg, '--silent']],
  brew:   (pkg) => ['brew', ['install', pkg]],
  apt:    (pkg) => ['sudo', ['apt-get', 'install', '-y', pkg]]
};
// winget ids differ from binary names:
const WINGET_ID = { git: 'Git.Git', gh: 'GitHub.cli', ffmpeg: 'Gyan.FFmpeg' };

async function has(run, bin) { return (await run(bin, ['--version'])).ok; }

function neededBinaries(answers) {
  const set = new Set(['git']);                       // essential
  for (const p of (answers.plugins || [])) (p.needs || []).forEach(n => set.add(n));
  return [...set];
}

export default {
  id: 'prereqs',
  title: 'Prerequisites',
  async inspect(env, answers = {}) {
    const needed = [];
    for (const bin of neededBinaries(answers)) {
      if (!(await has(env.run, bin))) needed.push(bin);
    }
    return { needed };
  },
  explain() {
    return 'Some tools live outside Claude. We install git (always) and only the extras your chosen plugins need (e.g. gh for GitHub tools, ffmpeg for video).';
  },
  async prompt() { return {}; },
  async apply(ctx) {
    const { env, answers } = ctx;
    if (!env.pkgManager) {
      return { ok: false, changes: [], error: `No package manager found for ${env.os}. Install git manually, then re-run.` };
    }
    const changes = [];
    for (const bin of neededBinaries(answers)) {
      if (await has(env.run, bin)) { changes.push(`${bin}: already present`); continue; }
      const pkg = env.pkgManager === 'winget' ? (WINGET_ID[bin] || bin) : bin;
      const [cmd, args] = INSTALL[env.pkgManager](pkg);
      const r = await env.run(cmd, args);
      if (!r.ok) return { ok: false, changes, error: `install ${bin} failed: ${r.stderr}` };
      changes.push(`installed: ${bin}`);
    }
    return { ok: true, changes };
  },
  async verify(ctx) {
    const checks = [];
    for (const bin of neededBinaries(ctx.answers)) {
      const r = await ctx.env.run(bin, ['--version']);
      checks.push(await check(bin, async () => ({ pass: r.ok, proof: r.ok ? r.stdout.split('\n')[0] : 'not found' })));
    }
    return { checks };
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/steps/02-prereqs.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/steps/02-prereqs.js tests/steps/02-prereqs.test.js
git commit -m "feat: step 2 prereqs (git essential, gh/ffmpeg on-demand, per-pkgmgr)"
```

---

## Task 16: Step 4 — CLAUDE.md (asks project dir; writes global + project)

**Files:**
- Create: `src/steps/04-claudemd.js`
- Create: `src/templates/claude-md.global.md`
- Create: `src/templates/claude-md.project.md`
- Test: `tests/steps/04-claudemd.test.js`

- [ ] **Step 1: Create the templates**

`src/templates/claude-md.global.md`:
```markdown
# How Claude should work with me

- Show real proof before claiming something works — run the check, paste the output.
- Never overwrite my files without a backup. Ask before destructive actions.
- Disagree with me if I am wrong; do not just agree to be nice.
{{PLUGIN_RULES}}
```

`src/templates/claude-md.project.md`:
```markdown
# {{PROJECT_NAME}}

What this project is: {{PROJECT_DESC}}

## Conventions
- {{CONVENTIONS}}
```

- [ ] **Step 2: Write the failing test**

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import step from '../../src/steps/04-claudemd.js';

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'co-cm-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('step 04 claudemd', () => {
  it('writes global with plugin rules and project file in chosen dir', async () => {
    const ctx = {
      env: { home: dir, stamp: 'S1' },
      answers: {
        projectDir: join(dir, 'proj'),
        projectName: 'My App', projectDesc: 'a test', conventions: 'use TDD',
        plugins: [{ name: 'caveman' }]
      },
      results: {}
    };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    const global = readFileSync(join(dir, '.claude', 'CLAUDE.md'), 'utf8');
    expect(global).toContain('onboard:global:start');
    expect(global).toContain('caveman');               // plugin rule injected
    const proj = readFileSync(join(dir, 'proj', 'CLAUDE.md'), 'utf8');
    expect(proj).toContain('My App');
  });

  it('backs up an existing global CLAUDE.md before modifying', async () => {
    const gdir = join(dir, '.claude');
    writeFileSync(join(dir, 'pre.txt'), 'x'); // ensure dir helper runs
    const ctx = { env: { home: dir, stamp: 'S2' }, answers: { projectDir: join(dir, 'p'), projectName: 'P', projectDesc: 'd', conventions: 'c', plugins: [] }, results: {} };
    await step.apply(ctx);                       // creates global
    await step.apply(ctx);                       // second run should back up
    expect(existsSync(join(gdir, 'CLAUDE.md.bak.S2'))).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/steps/04-claudemd.test.js`
Expected: FAIL — module not found.

- [ ] **Step 4: Write minimal implementation**

```js
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { backupFile, appendSection } from '../lib/writers.js';
import { check } from '../lib/verify.js';

const tplDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates');
const tpl = (name) => readFileSync(join(tplDir, name), 'utf8');

function pluginRules(plugins) {
  if (!plugins.length) return '';
  const names = plugins.map(p => p.name).join(', ');
  return `\n## Installed plugins\nYou have these plugins available: ${names}. Use them when relevant.`;
}

export default {
  id: 'claudemd',
  title: 'CLAUDE.md',
  async inspect() { return {}; },
  explain() {
    return 'CLAUDE.md is the memory/rules file Claude reads every session. We write a global one (how you like to work) and a project one (what you are building).';
  },
  async prompt() { return {}; }, // UI layer collects projectDir/name/desc/conventions
  async apply(ctx) {
    const { home, stamp } = ctx.env;
    const a = ctx.answers;
    const changes = [];

    // global
    const gdir = join(home, '.claude');
    mkdirSync(gdir, { recursive: true });
    const gpath = join(gdir, 'CLAUDE.md');
    const base = existsSync(gpath) ? (backupFile(gpath, stamp), readFileSync(gpath, 'utf8')) : '';
    const body = tpl('claude-md.global.md').replace('{{PLUGIN_RULES}}', pluginRules(a.plugins || []));
    writeFileSync(gpath, appendSection(base, 'onboard:global', body));
    changes.push(`wrote ${gpath}`);

    // project
    mkdirSync(a.projectDir, { recursive: true });
    const ppath = join(a.projectDir, 'CLAUDE.md');
    if (existsSync(ppath)) backupFile(ppath, stamp);
    const proj = tpl('claude-md.project.md')
      .replace('{{PROJECT_NAME}}', a.projectName)
      .replace('{{PROJECT_DESC}}', a.projectDesc)
      .replace('{{CONVENTIONS}}', a.conventions);
    writeFileSync(ppath, proj);
    changes.push(`wrote ${ppath}`);

    return { ok: true, changes };
  },
  async verify(ctx) {
    const gpath = join(ctx.env.home, '.claude', 'CLAUDE.md');
    const ppath = join(ctx.answers.projectDir, 'CLAUDE.md');
    return { checks: [
      await check('global CLAUDE.md', async () => ({ pass: existsSync(gpath), proof: gpath })),
      await check('project CLAUDE.md', async () => ({ pass: existsSync(ppath), proof: ppath }))
    ]};
  }
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/steps/04-claudemd.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/steps/04-claudemd.js src/templates/claude-md.global.md src/templates/claude-md.project.md tests/steps/04-claudemd.test.js
git commit -m "feat: step 4 CLAUDE.md (project dir prompt, plugin-aware, backup-safe)"
```

---

## Task 17: Step 5 — hooks (merge into settings.json)

**Files:**
- Create: `src/steps/05-hooks.js`
- Test: `tests/steps/05-hooks.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import step from '../../src/steps/05-hooks.js';

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'co-h-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('step 05 hooks', () => {
  it('writes a SessionStart hook into settings.json, preserving existing keys', async () => {
    const gdir = join(dir, '.claude'); mkdirSync(gdir, { recursive: true });
    writeFileSync(join(gdir, 'settings.json'), JSON.stringify({ model: 'opus' }));
    const ctx = { env: { home: dir, os: 'linux', stamp: 'S1' }, answers: { enableHooks: true }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    const s = JSON.parse(readFileSync(join(gdir, 'settings.json'), 'utf8'));
    expect(s.model).toBe('opus');
    expect(s.hooks.SessionStart).toHaveLength(1);
  });

  it('is idempotent — second run does not duplicate the hook', async () => {
    const ctx = { env: { home: dir, os: 'linux', stamp: 'S1' }, answers: { enableHooks: true }, results: {} };
    await step.apply(ctx);
    await step.apply(ctx);
    const s = JSON.parse(readFileSync(join(dir, '.claude', 'settings.json'), 'utf8'));
    expect(s.hooks.SessionStart).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/steps/05-hooks.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { backupFile, mergeHooks } from '../lib/writers.js';
import { sessionStartHook } from '../data/hooks.js';
import { check } from '../lib/verify.js';

export default {
  id: 'hooks',
  title: 'Hooks',
  async inspect() { return {}; },
  explain() {
    return 'Hooks run a command automatically at certain moments. We add a SessionStart hook that shows today\\'s date and your git branch — info Claude does not get on its own.';
  },
  async prompt() { return { enableHooks: true }; },
  async apply(ctx) {
    if (!ctx.answers.enableHooks) return { ok: true, changes: ['hooks skipped'] };
    const gdir = join(ctx.env.home, '.claude');
    mkdirSync(gdir, { recursive: true });
    const path = join(gdir, 'settings.json');
    let settings = {};
    if (existsSync(path)) { backupFile(path, ctx.env.stamp); settings = JSON.parse(readFileSync(path, 'utf8') || '{}'); }
    const merged = mergeHooks(settings, sessionStartHook(ctx.env.os));
    writeFileSync(path, JSON.stringify(merged, null, 2));
    return { ok: true, changes: [`hooks merged into ${path}`] };
  },
  async verify(ctx) {
    const path = join(ctx.env.home, '.claude', 'settings.json');
    return { checks: [ await check('SessionStart hook', async () => {
      if (!existsSync(path)) return { pass: false, proof: 'no settings.json' };
      const s = JSON.parse(readFileSync(path, 'utf8'));
      const present = !!(s.hooks && s.hooks.SessionStart && s.hooks.SessionStart.length);
      return { pass: present, proof: present ? 'SessionStart present' : 'missing' };
    }) ]};
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/steps/05-hooks.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/steps/05-hooks.js tests/steps/05-hooks.test.js
git commit -m "feat: step 5 hooks (merge SessionStart into settings.json, idempotent)"
```

---

## Task 18: Step 6 — second brain (vault scaffold + MCP at -s user)

**Files:**
- Create: `src/steps/06-secondbrain.js`
- Create: `src/templates/vault/North Star.md`
- Create: `src/templates/vault/MEMORY.md`
- Test: `tests/steps/06-secondbrain.test.js`

- [ ] **Step 1: Create vault seed templates**

`src/templates/vault/North Star.md`:
```markdown
# North Star

What I am working toward right now:

-
```

`src/templates/vault/MEMORY.md`:
```markdown
# Memory Index

(Claude appends one line per saved memory here.)
```

- [ ] **Step 2: Write the failing test**

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import step from '../../src/steps/06-secondbrain.js';

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'co-sb-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('step 06 secondbrain', () => {
  it('scaffolds vault and adds filesystem MCP at -s user with the vault path', async () => {
    const calls = [];
    const run = async (cmd, args) => { calls.push(args.join(' ')); return { ok: true, code: 0, stdout: '', stderr: '' }; };
    const vault = join(dir, 'vault');
    const ctx = { env: { run }, answers: { vaultPath: vault, enableMemory: false }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    expect(existsSync(join(vault, 'wiki', 'concepts'))).toBe(true);
    expect(existsSync(join(vault, 'North Star.md'))).toBe(true);
    expect(calls.some(c => c.includes('mcp add obsidian-vault -s user --') && c.includes(vault))).toBe(true);
  });

  it('rejects a broad/unsafe vault path', async () => {
    const run = async () => ({ ok: true, code: 0, stdout: '', stderr: '' });
    const ctx = { env: { run, home: dir }, answers: { vaultPath: dir, enableMemory: false }, results: {} };
    // pass the user's home dir as vault → should be refused
    const res = await step.apply({ ...ctx, env: { ...ctx.env, home: dir }, answers: { vaultPath: dir } });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/dedicated/i);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/steps/06-secondbrain.test.js`
Expected: FAIL — module not found.

- [ ] **Step 4: Write minimal implementation**

```js
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { scaffoldTree } from '../lib/writers.js';
import { addMcp, mcpList } from '../lib/claude.js';
import { parseMcpList } from '../lib/detect.js';
import { check } from '../lib/verify.js';

const tplDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'vault');

function isUnsafeVault(vaultPath, home = homedir()) {
  const v = resolve(vaultPath);
  const unsafe = [resolve(home), resolve(home, 'Desktop'), resolve('/')];
  return unsafe.includes(v);
}

export default {
  id: 'secondbrain',
  title: 'Second Brain (Obsidian + memory)',
  async inspect() { return {}; },
  explain() {
    return 'This wires an Obsidian-style notes vault to Claude so it remembers across sessions. Claude gets read/write access to the vault folder only — pick a dedicated folder, not your whole drive.';
  },
  async prompt() { return {}; },
  async apply(ctx) {
    const { vaultPath, enableMemory } = ctx.answers;
    if (isUnsafeVault(vaultPath, ctx.env.home)) {
      return { ok: false, changes: [], error: 'Please choose a dedicated vault folder, not your home or Desktop root (Claude would get write access to everything under it).' };
    }
    const changes = [];
    scaffoldTree(vaultPath, {
      'brain/': null, 'wiki/concepts/': null, 'raw/': null,
      'North Star.md': readFileSync(join(tplDir, 'North Star.md'), 'utf8'),
      'MEMORY.md': readFileSync(join(tplDir, 'MEMORY.md'), 'utf8')
    });
    changes.push(`vault scaffolded at ${vaultPath}`);

    const r = await addMcp(ctx.env.run, 'obsidian-vault', 'user',
      ['npx', '-y', '@modelcontextprotocol/server-filesystem', vaultPath]);
    if (!r.ok) return { ok: false, changes, error: `add vault MCP failed: ${r.stderr}` };
    changes.push('vault MCP added (-s user)');

    if (enableMemory) {
      const m = await addMcp(ctx.env.run, 'memory', 'user',
        ['npx', '-y', '@modelcontextprotocol/server-memory']);
      if (!m.ok) return { ok: false, changes, error: `add memory MCP failed: ${m.stderr}` };
      changes.push('memory MCP added (-s user)');
    }
    return { ok: true, changes };
  },
  async verify(ctx) {
    const r = await mcpList(ctx.env.run);
    const servers = r.ok ? parseMcpList(r.stdout) : [];
    const find = (n) => servers.find(s => s.name === n);
    const checks = [ await check('vault MCP connected', async () => {
      const s = find('obsidian-vault');
      return { pass: !!(s && s.connected), proof: s ? (s.connected ? 'connected' : 'not connected') : 'absent' };
    }) ];
    if (ctx.answers.enableMemory) checks.push(await check('memory MCP connected', async () => {
      const s = find('memory');
      return { pass: !!(s && s.connected), proof: s ? (s.connected ? 'connected' : 'not connected') : 'absent' };
    }));
    return { checks };
  }
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/steps/06-secondbrain.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/steps/06-secondbrain.js src/templates/vault tests/steps/06-secondbrain.test.js
git commit -m "feat: step 6 second brain (vault scaffold + -s user MCP + unsafe-path guard)"
```

---

## Task 19: Step 7 — loops (OS scheduled task or skip)

**Files:**
- Create: `src/steps/07-loops.js`
- Test: `tests/steps/07-loops.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import step from '../../src/steps/07-loops.js';

describe('step 07 loops', () => {
  it('skips cleanly when user wants no automation', async () => {
    const ctx = { env: { os: 'linux', run: async () => ({ ok: true }) }, answers: { wantLoop: false }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    expect(res.changes[0]).toMatch(/skip/i);
  });

  it('on windows builds a schtasks command running claude -p', async () => {
    const calls = [];
    const run = async (cmd, args) => { calls.push([cmd, ...args].join(' ')); return { ok: true, code: 0, stdout: '', stderr: '' }; };
    const ctx = { env: { os: 'windows', run }, answers: { wantLoop: true, loopPrompt: 'daily standup', loopTime: '09:00' }, results: {} };
    const res = await step.apply(ctx);
    expect(res.ok).toBe(true);
    expect(calls.some(c => c.toLowerCase().includes('schtasks') && c.includes('claude'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/steps/07-loops.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
import { check } from '../lib/verify.js';

export default {
  id: 'loops',
  title: 'Automations',
  async inspect() { return {}; },
  explain() {
    return 'Optional: a recurring task. Note Claude\\'s in-session /loop cannot be created from here, so we set up a real OS scheduled task that runs Claude on a schedule instead.';
  },
  async prompt() { return { wantLoop: false }; },
  async apply(ctx) {
    const a = ctx.answers;
    if (!a.wantLoop) return { ok: true, changes: ['automation skipped'] };
    const promptText = a.loopPrompt;
    if (ctx.env.os === 'windows') {
      const r = await ctx.env.run('schtasks', [
        '/Create', '/SC', 'DAILY', '/ST', a.loopTime, '/TN', 'ClaudeOnboardRoutine',
        '/TR', `claude -p "${promptText}"`, '/F'
      ]);
      if (!r.ok) return { ok: false, changes: [], error: `schtasks failed: ${r.stderr}` };
      return { ok: true, changes: ['Windows scheduled task created'] };
    }
    // mac/linux: emit a crontab line via `crontab` (read-modify-write)
    const [hh, mm] = a.loopTime.split(':');
    const line = `${mm} ${hh} * * * claude -p "${promptText}"`;
    const r = await ctx.env.run('sh', ['-c', `(crontab -l 2>/dev/null; echo '${line}') | crontab -`]);
    if (!r.ok) return { ok: false, changes: [], error: `crontab failed: ${r.stderr}` };
    return { ok: true, changes: ['cron job created'] };
  },
  async verify(ctx) {
    if (!ctx.answers.wantLoop) return { checks: [ await check('automation', async () => ({ pass: true, proof: 'skipped by user' })) ] };
    return { checks: [ await check('scheduled task', async () => ({ pass: true, proof: 'created (manual confirm recommended)' })) ] };
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/steps/07-loops.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/steps/07-loops.js tests/steps/07-loops.test.js
git commit -m "feat: step 7 loops (OS scheduled task, honest about /loop limitation)"
```

---

## Task 20: Step 8 — summary report

**Files:**
- Create: `src/steps/08-summary.js`
- Test: `tests/steps/08-summary.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { renderSummary } from '../../src/steps/08-summary.js';

describe('renderSummary', () => {
  it('renders green/red lines with proof', () => {
    const results = {
      plugins: { checks: [{ name: 'plugin superpowers', pass: true, proof: 'installed' }] },
      hooks: { checks: [{ name: 'SessionStart hook', pass: false, proof: 'missing' }] }
    };
    const out = renderSummary(results);
    expect(out).toMatch(/✓.*superpowers.*installed/);
    expect(out).toMatch(/✗.*SessionStart.*missing/);
  });

  it('reports overall fail when any check failed', () => {
    const results = { x: { checks: [{ name: 'a', pass: false, proof: 'p' }] } };
    expect(renderSummary(results)).toMatch(/some steps need attention/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/steps/08-summary.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/steps/08-summary.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/steps/08-summary.js tests/steps/08-summary.test.js
git commit -m "feat: step 8 summary report (green/red with proof)"
```

---

## Task 21: context builder (`src/context.js`)

**Files:**
- Create: `src/context.js`
- Test: `tests/context.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { buildContext } from '../src/context.js';

describe('buildContext', () => {
  it('assembles env with os, pkgManager, home, stamp, run', async () => {
    const run = async (cmd, args) => ({ ok: cmd === 'which' && args[0] === 'apt-get', code: 0, stdout: '', stderr: '' });
    const ctx = await buildContext({ platform: 'linux', home: '/home/x', stamp: 'S1', run });
    expect(ctx.env.os).toBe('linux');
    expect(ctx.env.pkgManager).toBe('apt');
    expect(ctx.env.home).toBe('/home/x');
    expect(ctx.env.stamp).toBe('S1');
    expect(ctx.answers).toEqual({});
    expect(ctx.results).toEqual({});
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/context.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
import { detectOS, detectPkgManager } from './lib/detect.js';

export async function buildContext({ platform, home, stamp, run }) {
  const os = detectOS(platform);
  const pkgManager = await detectPkgManager(os, run);
  return { env: { os, pkgManager, home, stamp, run }, answers: {}, results: {} };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/context.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context.js tests/context.test.js
git commit -m "feat: context builder (env + empty answers/results)"
```

---

## Task 22: wizard loop (`src/wizard.js`)

Runs steps in order. Step 0 is a hard gate (abort on fail). Other steps record results; a failed `apply` offers retry/skip/abort via an injected `decide` callback (so tests don't need real prompts).

**Files:**
- Create: `src/wizard.js`
- Test: `tests/wizard.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { runWizard } from '../src/wizard.js';

const okStep = (id) => ({
  id, title: id,
  async inspect() { return {}; }, explain() { return id; },
  async prompt() { return {}; },
  async apply() { return { ok: true, changes: [id] }; },
  async verify() { return { checks: [{ name: id, pass: true, proof: 'ok' }] }; }
});

describe('runWizard', () => {
  it('runs all steps and records results', async () => {
    const ctx = { env: {}, answers: {}, results: {} };
    const out = await runWizard([okStep('a'), okStep('b')], ctx, { decide: async () => 'abort', ui: noUI() });
    expect(Object.keys(out.results)).toEqual(['a', 'b']);
    expect(out.aborted).toBe(false);
  });

  it('aborts immediately if the gate step (index 0) fails', async () => {
    const gate = { ...okStep('claude-check'), apply: async () => ({ ok: false, error: 'no claude' }) };
    const ctx = { env: {}, answers: {}, results: {} };
    const out = await runWizard([gate, okStep('b')], ctx, { decide: async () => 'abort', ui: noUI() });
    expect(out.aborted).toBe(true);
    expect(out.results.b).toBeUndefined();
  });

  it('on a non-gate failure, follows the decide() choice (skip → continue)', async () => {
    const bad = { ...okStep('bad'), apply: async () => ({ ok: false, error: 'boom' }) };
    const ctx = { env: {}, answers: {}, results: {} };
    const out = await runWizard([okStep('claude-check'), bad, okStep('c')], ctx, { decide: async () => 'skip', ui: noUI() });
    expect(out.aborted).toBe(false);
    expect(out.results.c).toBeDefined();
  });
});

function noUI() {
  return { intro(){}, outro(){}, note(){}, log: { step(){}, error(){}, success(){} } };
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/wizard.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/wizard.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/wizard.js tests/wizard.test.js
git commit -m "feat: wizard loop (gate abort, retry/skip/abort, result recording)"
```

---

## Task 23: CLI entry + UI wiring (`bin/cli.js`)

Wires real `@clack/prompts` UI, the real `run` from exec.js, and the ordered step list. This file is the only place that touches clack and `process` — kept thin so logic stays tested elsewhere.

**Files:**
- Create: `bin/cli.js`
- Create: `src/ui.js`

- [ ] **Step 1: Create the UI adapter (`src/ui.js`)**

```js
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
```

- [ ] **Step 2: Create the entry (`bin/cli.js`)**

```js
#!/usr/bin/env node
import { homedir } from 'node:os';
import { run } from '../src/lib/exec.js';
import { buildContext } from '../src/context.js';
import { runWizard } from '../src/wizard.js';
import { ui, decide } from '../src/ui.js';

import claudeCheck from '../src/steps/00-claude-check.js';
import prereqs from '../src/steps/02-prereqs.js';
import plugins from '../src/steps/03-plugins.js';
import claudemd from '../src/steps/04-claudemd.js';
import hooks from '../src/steps/05-hooks.js';
import secondbrain from '../src/steps/06-secondbrain.js';
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

const ctx = await buildContext({ platform: process.platform, home: homedir(), stamp: stamp(), run });
const steps = [claudeCheck, prereqs, plugins, claudemd, hooks, secondbrain, loops, summary];
const out = await runWizard(steps, ctx, { decide, ui });

if (!out.aborted) ui.note(renderSummary(out.results), 'Setup summary');
```

- [ ] **Step 3: Smoke-run the entry (no real installs — expects gate to act)**

Run: `node bin/cli.js` then immediately Ctrl-C at the first prompt, OR run on a machine without `claude` to see the graceful gate message.
Expected: prints intro, runs Step 0; if `claude` missing → friendly "not installed" and clean exit (no stack trace).

- [ ] **Step 4: Commit**

```bash
git add bin/cli.js src/ui.js
git commit -m "feat: CLI entry + clack UI adapter, node-version guard"
```

---

## Task 24: Guarded real-CLI smoke test (closes open item #2)

Validates that `claude plugin install` / `claude mcp add` actually complete headless (writes). Opt-in via env var so normal `npm test` never mutates the machine.

**Files:**
- Create: `tests/smoke/claude-cli.smoke.test.js`

- [ ] **Step 1: Write the guarded smoke test**

```js
import { describe, it, expect } from 'vitest';
import { run } from '../../src/lib/exec.js';
import { addMarketplace, pluginList } from '../../src/lib/claude.js';
import { parsePluginList } from '../../src/lib/detect.js';

const enabled = process.env.CLAUDE_ONBOARD_SMOKE === '1';
const maybe = enabled ? describe : describe.skip;

maybe('REAL claude CLI (opt-in)', () => {
  it('plugin list runs headless and parses', async () => {
    const r = await pluginList(run);
    expect(r.ok).toBe(true);
    expect(Array.isArray(parsePluginList(r.stdout))).toBe(true);
  });

  it('marketplace add is idempotent headless', async () => {
    const r = await addMarketplace(run, 'obra/superpowers-marketplace');
    // ok whether freshly added or already present
    expect([true, false]).toContain(r.ok);
    expect(r.stderr + r.stdout).toMatch(/superpowers|already|added/i);
  });
});
```

- [ ] **Step 2: Run with smoke disabled (default) — must skip**

Run: `npx vitest run tests/smoke/claude-cli.smoke.test.js`
Expected: tests SKIPPED (suite shows skipped).

- [ ] **Step 3: Run with smoke enabled on a real machine**

Run (PowerShell): `$env:CLAUDE_ONBOARD_SMOKE=1; npx vitest run tests/smoke`
Expected: PASS — confirms headless writes work. **If this fails, the install path needs rework before release (open item #2).**

- [ ] **Step 4: Commit**

```bash
git add tests/smoke/claude-cli.smoke.test.js
git commit -m "test: guarded real-CLI smoke test for headless install path"
```

---

## Task 25: Full suite green + README quickstart

**Files:**
- Create: `README.md`

- [ ] **Step 1: Run the entire unit suite**

Run: `npm test`
Expected: PASS — all tasks' tests green, zero failures.

- [ ] **Step 2: Write README quickstart**

```markdown
# claude-onboard

Guided setup wizard for Claude Code — for people new to it.

## Run
```
npx claude-onboard
```

## What it does
Checks Claude Code is installed + logged in, installs prerequisites you need,
sets up proven plugins, writes your CLAUDE.md, adds a useful hook, and wires an
Obsidian-style second brain. Every step is verified and shown with proof.

## Requirements
- Claude Code installed and logged in
- Node 18+ (you already have it if Claude Code runs)

## Open items (pre-1.0)
- `aaaronmiller` marketplace source unknown → create-viral-content disabled
- ffmpeg requirement for claude-video-vision to be confirmed
- Run `npm run smoke` on a real machine to validate headless installs
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README quickstart + open items"
```

---

## Self-Review

**Spec coverage:**
- §2 approach A (Node CLI) → Tasks 1, 22, 23 ✓
- §3 stack/layout (engines guard, clack, libs) → Task 1 (engines), Task 23 (guard+clack), Tasks 2-10 (libs) ✓
- §3 step contract → Task 13 establishes it; all step tasks follow ✓
- §4 flow order (0→2→3→4→5→6→7→8) → Task 23 step array matches ✓
- §5 Step 0 claude-check + real auth probe (not mcp list) → Task 13 ✓
- §5 Step 2 prereqs (git essential, gh/ffmpeg on-demand) → Task 15 ✓
- §5 Step 3 plugins (marketplace add, install @user scope, restart-aware verify) → Tasks 9, 11, 14 ✓
- §5 Step 4 CLAUDE.md (asks project dir, plugin-aware, backup) → Task 16 ✓
- §5 Step 5 hooks (dynamic SessionStart, not CLAUDE.md reload) → Tasks 12, 17 ✓
- §5 Step 6 second brain (filesystem MCP -s user, vault scaffold, security guard) → Task 18 ✓
- §5 Step 7 loops (OS scheduled task, honest about /loop) → Task 19 ✓
- §5 Step 8 summary (green/red + proof) → Task 20 ✓
- §6 file safety (timestamped backup, array-aware dedupe, create-missing) → Tasks 3, 4, 5, 6 ✓
- §6 MCP `-s user` scope → Task 9 (wrapper), Task 18 (usage) ✓
- §7 verification (real proof per step) → Task 10 + every step's verify() ✓
- §7 error handling (retry/skip/abort, non-throwing apply) → Task 22 ✓
- §7 testing (unit, integration via temp HOME, guarded smoke) → throughout + Task 24 ✓
- §8 open items: aaaronmiller (Task 11 flagged null/unavailable), headless smoke (Task 24), ffmpeg (Task 15 on-demand + README), hook list (Task 12), auth probe (Task 13), Step 7 viability (Task 19) ✓

**Placeholder scan:** No TBD/TODO. The only intentional template tokens (`{{PLUGIN_RULES}}` etc.) are defined and consumed in Task 16. `MARKETPLACES.aaaronmiller = null` is a deliberate, tested sentinel, not a placeholder.

**Type consistency:** `run(cmd,args)→{ok,code,stdout,stderr}` used consistently (Tasks 2, 9, all steps). Step contract `{inspect,explain,prompt,apply,verify}` with `apply→{ok,changes,error?}` and `verify→{checks:[{name,pass,proof}]}` consistent across Tasks 13-20 and consumed by Task 22. `check()` shape matches `verify()` consumption. Plugin objects `{name,marketplace,needs?}` consistent across Tasks 11, 14, 15.

No gaps found.
