# claude-onboard — Design Spec

**Date:** 2026-05-31
**Owner:** Nick Anderson
**Status:** Approved design → ready for implementation plan
**Working title:** `claude-onboard` (rename freely)
**Location:** `C:\Users\nicho\Desktop\Projects\claude-onboard\`

---

## 1. Purpose

A guided CLI wizard that takes a new, non-technical "vibe coder" from a fresh
machine to a fully working, *verified* Claude Code setup — CLAUDE.md, hooks,
loops, a curated set of game-changer plugins, and a Karpathy-style Obsidian
second brain wired to Claude's memory.

The wizard teaches as it configures: every step explains the concept in plain
English before acting ("guided full control").

**Audience:** Nick + small circle (friends, clients being onboarded).
**Platforms:** Windows, macOS, Linux — day one.

---

## 2. Approach (chosen: A — Pure Node CLI)

A deterministic Node CLI run via `npx`. Same answers always produce the same
setup. No LLM calls, no API cost, fully auditable, works offline.

Rejected:
- **B (delegate to Claude Code):** non-deterministic, costs tokens, hard to
  verify — violates the no-gaslighting / show-real-proof standard.
- **C (hybrid w/ Claude-assisted CLAUDE.md):** good idea, deferred to v2 as a
  clearly-scoped add-on.

**Key validated fact:** Claude Code requires Node.js, so any user who has Claude
Code already has Node — `npx` is safe. Headless `claude` CLI reads
(`plugin list`, `mcp list`) are confirmed working from a plain shell.

---

## 3. Tech stack

- Node.js, ES modules, run via `npx`.
- `engines: { node: ">=18" }` + a runtime version guard that prints a friendly
  message and exits if Node is too old.
- UI: `@clack/prompts` (friendly prompts, spinners, intro/outro).
  Honest dep statement: minimal deps — clack + its tree, plus Node built-ins
  for `exec`/`fs`. (Not "zero deps.")
- No build step. Plain JS from `npx`.

### Layout

```
bin/cli.js            entry — runs the wizard loop
src/steps/            one module per step (see §5)
src/lib/
  detect.js           OS, paths, versions, installed plugins/MCP, pkg-mgr presence
  writers.js          safe writes: mergeJson (array-aware dedupe), appendSection
                      (idempotent marker), scaffoldTree, timestamped backups
  exec.js             cross-platform command runner; winget/brew/apt aware;
                      captures stdout/stderr/exit; never hides failures
  verify.js           reusable checks: fileExists, cmdSucceeds, jsonHasKey,
                      pluginLoaded, mcpConnected — each returns a real proof string
templates/            CLAUDE.md template, hook snippets, vault skeleton + seed notes
```

### Step contract

Every step module exports the same shape so the loop is uniform:

```js
export default {
  id, title,
  inspect(env)    -> { status, already, missing },   // current state (renamed from detect)
  explain(env)    -> string,                          // plain-English what/why
  prompt(ctx)     -> answers,                          // clack questions
  apply(ctx)      -> { ok, changes[], error? },        // do work; no throw on expected fail
  verify()        -> { checks: [{ name, pass, proof }] }
}
```

- `apply()` returns a result object; it throws only on real bugs, never on
  expected failures (those go in `{ ok:false, error }`).
- A shared context `ctx = { env, answers, results }` is threaded through every
  step so later steps read earlier answers.

---

## 4. Wizard flow

```
0. Claude Code check        installed on PATH? authenticated? guide install/login if not
1. Environment scan         OS, Node, versions, installed plugins/MCP, pkg-mgr present?
2. Prerequisites            git only (essential). gh/ffmpeg installed by the PLUGINS step
                            when a chosen plugin needs them (decoupled — prereqs runs before
                            plugin selection, so it cannot know needs). Python/WSL/Docker on demand.
3. Plugins / MCP            add 6 marketplaces, install core 6 + offer other 8, verify
4. CLAUDE.md                interview; writes rules MATCHING the plugins just chosen
5. Hooks                    defined small set (see §6), correct per-OS syntax
6. Second Brain bundle      filesystem-MCP@vaultpath + memory server + vault skeleton + rules
6b. NORTH STAR (headline)   interview → write brain/North Star.md + install om-standup-lite
7. Loops / automation       optional standing automations
8. Summary report           green/red checklist with real proof per item
```

**Cross-cutting:**
- **Idempotent** — re-running never duplicates (detect-then-skip, merge/append).
- **No resume-state file in v1** (YAGNI for audience). Idempotency covers re-runs.
- User can skip any step.

---

## 5. Step details

### Step 0 — Claude Code check
1. `claude` on PATH? If not → explain + official install link, exit gracefully.
2. Authenticated? **`claude mcp list` is NOT a valid auth probe** (it only reads
   local MCP config, no account auth). Use a real probe: a minimal headless
   round-trip (`claude -p "ok"` with a short timeout) or a credentials check.
   If logged out → guide login, resume. *(exact probe validated at plan time.)*
3. Both pass → continue.

### Step 1 — Environment scan
Run `detect.js` once. Show a "here's your machine" summary (OS, Node version,
package manager found, what's already installed). Builds `env`, passed to all steps.

### Step 2 — Prerequisites
- **Package-manager detection first.** winget (Windows) / brew (macOS) / apt
  (Debian). If missing → show exact get-it steps, mark dependent installs
  "manual," never crash.
- Tiers:
  - **Essential:** git only. (`gh` CLI moved to on-demand — see below — since
    its `gh-cli` plugin is optional-tier; don't install gh for users who skip it.)
  - **Common (on demand):** `gh` CLI — installed only if user selects the
    `gh-cli` or `code-review` plugin. ffmpeg — only if user opts into
    claude-video-vision (the ffmpeg dependency is verified at plan time, not
    assumed).
  - **Advanced (opt-in, warned about size/admin):** WSL/Ubuntu, Docker, Python+uv.
- Each install: shell out → capture output → verify (`git --version`, etc.).

### Step 3 — Plugins / MCP
Add marketplaces, then install plugins, then verify via `claude plugin list`.

**Marketplaces (grounded sources):**
| Marketplace | Source |
|---|---|
| superpowers-marketplace | `obra/superpowers-marketplace` |
| caveman | `JuliusBrussee/caveman` |
| trailofbits | `trailofbits/skills` |
| claude-plugins-official | `anthropics/claude-plugins-official` |
| claude-video-vision | git: `https://github.com/jordanrendric/claude-video-vision.git` |
| aaaronmiller | **UNKNOWN — must resolve before build** (optional-tier; v1 can ship without) |

Command: `claude plugin marketplace add <owner/repo-or-url>`

**Plugins:**
- **Core 6 (default ON):** superpowers, caveman, claude-session-driver,
  double-shot-latte, ask-questions-if-underspecified, debug-buttercup.
- **Optional 8 (offered, unchecked):** elements-of-style, private-journal-mcp,
  agentic-actions-auditor, differential-review, gh-cli, code-review,
  claude-video-vision, create-viral-content.

Command: `claude plugin install <name>@<marketplace>` (default scope `user` =
global — confirmed via `plugin install --help`).
Verify: parse `claude plugin list` → name **present + installed**. Do NOT
fail on not-yet-`enabled`: `plugin update --help` notes "restart required to
apply," so a freshly installed plugin may show inactive until restart. Verify
checks *installed*; report "active after restart" where applicable.

### Step 4 — CLAUDE.md (after plugins so rules match)
Short interview (what are you building? how cautious? folder conventions?).
**First ask/confirm the target project directory** — the wizard's cwd is not
assumed to be the user's project. Writes global `~/.claude/CLAUDE.md` + a
project `CLAUDE.md` in the confirmed dir, from template, including rules tuned
to the chosen plugins (e.g. superpowers/caveman usage).

### Step 5 — Hooks (defined set, not vapor)
Enable a small, explained set written to `~/.claude/settings.json`. Hooks must
do something Claude does NOT already do (Claude auto-loads CLAUDE.md, so a
"load CLAUDE.md" hook is redundant — excluded). Candidate set:
- **SessionStart** hook that injects *dynamic* context Claude lacks: current
  date, `git status`/branch, or a North Star line — not a re-print of CLAUDE.md.
- Optional **UserPromptSubmit** reminder hook.
Per-OS command syntax (PowerShell on Windows, bash on Mac/Linux).
Exact hook list finalized in the implementation plan.

### Step 6 — Second Brain bundle
The real Obsidian↔Claude wiring (grounded in Nick's live config). **Both servers
added at `-s user` scope** — confirmed `mcp add` defaults to `local` (cwd-only),
which would NOT make the second brain global:
1. **Vault filesystem MCP:** `claude mcp add obsidian-vault -s user -- npx -y
   @modelcontextprotocol/server-filesystem <VAULT_PATH>` — **wizard asks for
   VAULT_PATH.** ⚠️ **Security:** this grants Claude full read/write over that
   path. Wizard warns and recommends a dedicated vault folder — never a broad
   path (home dir, whole Desktop).
2. **Memory server (offered, default off):** `claude mcp add memory -s user --
   npx -y @modelcontextprotocol/server-memory` (knowledge-graph store, separate
   from the vault).
3. **Vault skeleton:** scaffold `brain/`, `wiki/concepts/`, `raw/` + seed
   `MEMORY.md`. Create-missing only; never touch existing notes. **North Star.md
   is NOT seeded here** — it is owned by Step 6b (the interview), so this step
   only creates the empty `brain/` directory it will live in.
4. **CLAUDE.md wiki-pattern rules:** append Karpathy-pattern rules (wikilinks,
   raw→concepts, Claude maintains the wiki).

### Step 6b — NORTH STAR (headline feature)
The centerpiece. Most users (even experienced ones) don't have a clear North
Star, so the wizard *builds one with them* rather than dropping an empty file.
1. **Explain** plainly: a North Star is a living goals document Claude reads at
   the start of every session to stay aligned with what you're actually working
   toward. It is the single most valuable piece of context you can give Claude.
2. **Interview** (all fields optional — a beginner can fill just "current focus"):
   - Current focus (one line)
   - Short-term goals (this quarter)
   - Medium-term goals (this half)
   - Long-term goals (this year+)
3. **Write** `<vault>/brain/North Star.md` with proper frontmatter
   (`date`, `description`, `tags: [brain, north-star]`, `aliases: [Goals, Focus]`)
   matching the established vault schema. Backup-safe if it already exists.
4. **Install om-standup-lite:** write a project slash command
   `<projectDir>/.claude/commands/om-standup.md` that instructs Claude to read
   `brain/North Star.md` and summarize current focus + open goals at session
   start. This is the lite version of the user's own `/om-*` pack (a bespoke
   project-local command system, not a marketplace plugin).
5. **Verify:** North Star.md exists with the interview content; the om-standup
   command file exists.

### Step 7 — Loops / automation (optional, re-scoped)
**A shell wizard cannot create a `/loop`** — that's an in-session Claude command.
So this step does NOT promise `/loop`. What it CAN do deterministically:
- Write an **OS-level scheduled task** (Windows Task Scheduler / cron) that runs
  `claude -p "<routine prompt>"` on a schedule, if the user wants a recurring
  automation.
- Drop a documented **routine prompt stub** the user can paste into a session.
If neither is wanted, skip. (If even this proves fragile at plan time, cut Step 7
from v1 entirely — flagged as a candidate cut.)

### Step 8 — Summary report
Green/red table of everything done, each row showing its real verification proof
line. Next-steps guidance.

---

## 6. Data flow & file outputs

Inputs: user answers (in `ctx.answers`) + `env` snapshot.
Outputs: real files + installed plugins/MCP.

| Target | Action | Safety |
|---|---|---|
| `~/.claude/CLAUDE.md`, `./CLAUDE.md` | append/write with marker | timestamped backup `CLAUDE.md.bak.<ts>` (never reused/overwritten) |
| `~/.claude/settings.json` | merge hooks block | array-aware dedupe — match hook by event+command, skip if present |
| marketplaces | `claude plugin marketplace add <source>` | detect-then-skip if present |
| plugins | `claude plugin install <name>@<mkt>` | verify via `claude plugin list` |
| memory MCP (offered, default off) | `claude mcp add memory -s user -- npx -y @modelcontextprotocol/server-memory` | `-s user` = global; verify `mcp list` Connected |
| vault MCP | `claude mcp add obsidian-vault -s user -- npx -y @modelcontextprotocol/server-filesystem <VAULT_PATH>` | `-s user`; wizard asks VAULT_PATH + warns broad-path security; verify Connected |
| vault skeleton | scaffold `brain/`,`wiki/concepts/`,`raw/` + seed `MEMORY.md` | create-missing only; never overwrite notes (North Star.md excluded — see below) |
| `<vault>/brain/North Star.md` | write from interview, with frontmatter | timestamped backup if exists; never silently overwrite |
| `<projectDir>/.claude/commands/om-standup.md` | write om-standup-lite command | create-missing only |

**Guarantees:**
- Nothing destructive: every existing-file write uses timestamped backup +
  merge/append, never raw overwrite. Vault notes untouched if present.
- Real CLI commands only (no reimplementation) — auditable.

---

## 7. Verification, errors, testing

**Verification (real proof per step):**
- Prereqs: capture `--version` output strings.
- Plugins: `claude plugin list` shows name + `enabled`.
- MCP: `claude mcp list` shows `✓ Connected`.
- Files: re-read, confirm marker + key present.
- Summary report: green/red with the actual proof line under each. Nothing
  claimed done without its check passing.

**Error handling:**
- `apply()` → `{ok:false, error}` → show real stderr, offer retry / skip / abort.
- Network/pkg-mgr failures explained plainly, never silent.
- Abort leaves clean partial state; idempotent re-run continues.

**Testing:**
- Unit: `writers.js` (merge/dedupe/backup), `detect.js` (mock OS).
- Integration: each step against a temp HOME, assert files + parse mock CLI output.
- **Smoke test (must pass before trusting install):** real `claude plugin
  install` + `claude mcp add` against a throwaway plugin/server, headless —
  validates the one unproven write path.
- Manual: full run on clean Windows + clean Mac.

---

## 8. Open items before build

1. **`aaaronmiller` marketplace source** (for create-viral-content) — unknown;
   optional-tier so v1 can ship without it.
2. **Headless write smoke test** — confirm `claude plugin install` / `claude mcp
   add` complete non-interactively (reads already confirmed).
3. **ffmpeg ↔ claude-video-vision dependency** — verify it's actually required
   before listing it.
4. **Exact hook list + snippets** — finalize in implementation plan.
5. **Auth probe method** — confirm a reliable headless logged-in/out check
   (minimal `claude -p` vs credentials inspection).
6. **Step 7 viability** — confirm OS scheduled-task path works cross-platform;
   else cut Step 7 from v1.

---

## 9. Out of scope (v1)

- Claude-assisted CLAUDE.md authoring (v2, approach C).
- Resume-state file.
- Publishing to public npm / freemium product polish.
- Telemetry.
