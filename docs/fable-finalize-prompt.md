# Fable finalize prompt — claude-onboard "master setup for two friends" (GOAL PROMPT)

> Paste everything below the line into a fresh Fable (Claude 5) session opened at
> `C:\Users\nicho\Desktop\Projects\claude-onboard`. Fill the one `{{ECC_REPO_URL}}`
> placeholder first (the Everything-Claude-Code repo URL — it is not installed on my
> machine, so you must get it from me).

---

# GOAL

Ship `claude-onboard` in a state where either of my two friends — both residential **and** commercial
real estate agents — can run one paste on a fresh machine, sign in, pick a "Run my real estate business"
goal, and end up with a complete, curated, verified Claude Code environment: a sanitized operating-manual
CLAUDE.md, a real estate agent, a Gmail email agent, the full skill stack (superpowers + caveman + the
entire ECC library), Obsidian + vault, all proven working with pasted command output.

Working directory: `C:\Users\nicho\Desktop\Projects\claude-onboard`

# SUCCESS CRITERIA (this is how "done" is measured — every item needs pasted proof)

1. **`npm test` green** — paste the pass count.
2. **Sanitized CLAUDE.md** — `src/templates/claude-md.global.md` is a full operating manual with **zero**
   personal/financial/client/trading/psychology references. Prove it: `grep` for the stripped terms
   (polymarket, revolut, psychology, retainer, whitespace, salary, PMv3, etc.) → empty results pasted.
3. **Real estate agent live** — one real invocation pasted: a commercial cap-rate/NOI calc **and** a
   residential listing draft.
4. **Gmail email agent live** — one dry-run pasted: summarize a thread + draft a reply, **no send**.
5. **Full skill stack installed** — paste `claude plugin list` showing superpowers, caveman, and the ECC
   library loaded; paste the count of ECC skills that registered.
6. **Clean guided run** — selecting the real estate goal, paste `claude plugin list`, `claude mcp list`
   (Gmail connected), and the installed skills list.
7. **Installer correct for these users** — skips the Claude desktop app (already installed), keeps the
   Git-path + `ErrorActionPreference='Continue'` fixes, hard-gates on Pro/Max auth.

If any criterion can't be met, stop and tell me exactly what blocked it — do not paper over it.

# FIXED FACTS (do not re-ask me these)
- Both friends already have the **Claude desktop app installed** → installer must **skip** `Anthropic.Claude`.
- Both have **Claude Pro/Max plans** → stack is supported. Still hard-gate on auth so a free-tier sign-in fails loud.
- Both use **Gmail / Google Workspace** → the email agent wires to Gmail (not Outlook).
- Primary platform is **Windows** (`install.ps1` is the live path). Keep `install.sh` working; Windows must pass.
- **Skill stack decision is made:** install **superpowers + caveman + the FULL ECC library** (not a cherry-picked
  subset). This is my call — I know a large catalog adds per-session context weight and support surface; I accept
  that trade for blank-slate users who benefit from breadth. Do not silently prune ECC to "help."

# REPO GROUND TRUTH (read before touching anything)
- `src/data/goals.js` — guided goal picker. `GOALS[]` maps plain-English goal → `extras` (plugins), `mcp`, `skills`. **Integration point for new capabilities.**
- `src/data/plugins.js` — `MARKETPLACES`, `CORE` (always installed: superpowers, caveman, claude-session-driver, double-shot-latte, ask-questions-if-underspecified, debug-buttercup), `OPTIONAL` (goal-gated).
- `src/data/mcp.js` — `MCP_SERVERS[]`, npx-based/portable only (no machine paths).
- `src/data/skills.js` — `CLONE_SKILLS` (git-clone), `BUNDLED_SKILLS` (currently `[]`, shipped from `assets/skills/<name>`), `BUNDLED_COMMANDS`. Step-06e installs `BUNDLED_SKILLS` with no code change — **this is where the two new agents plug in.**
- `src/steps/06e-skills.js` — installs skills/commands. `src/steps/06d-mcp.js` — registers goal-selected MCP servers. `src/steps/03-plugins.js` — installs marketplaces + plugins.
- `src/templates/claude-md.global.md` — the CLAUDE.md the product writes to `~/.claude/`. Currently a generic 5-liner; you are replacing it.
- `install.ps1` — Windows installer. Note the deliberate `$ErrorActionPreference='Continue'` and hardcoded Git paths in `Refresh-Path`. **Do not reintroduce `Stop` or stderr redirects on winget** — that was the confirmed zero-plugins bug.

# WORKING DISCIPLINE (my hard rules — follow exactly)
1. **Task 0 first: brainstorm → written plan → my approval → build.** Use the superpowers `brainstorming`
   skill, then `writing-plans`, and STOP for my sign-off on the written plan before any implementation.
2. **TDD** for real logic (the commercial calc helpers, provider wiring, gates). One runnable check per non-trivial unit.
3. **Verification before completion** — never claim done without pasting the proof (see Success Criteria).
4. **Surgical changes** — touch only what each task needs; match existing style; no speculative abstractions.
5. **No secrets in the repo** — Gmail OAuth is per-user at setup, never a committed token/key.
6. **Irreversible/outward actions gate** — the email agent drafts only; never sends/archives/deletes without explicit per-action confirmation.

---

# PATH TO THE GOAL

## Task 0 — Plan and get approval
Brainstorm the build, write the plan to `docs/`, stop for my approval. Nothing below starts until I sign off.

## Task 1 — Sanitized operating-principles CLAUDE.md (privacy-critical)
Replace `src/templates/claude-md.global.md` with a rich but **fully sanitized** operating manual derived from my
personal `C:\Users\nicho\.claude\CLAUDE.md`.
- **Keep (methodology layer):** show-proof-before-claiming / no gaslighting, no sycophancy (disagree when I'm wrong),
  no self-contradiction, verification-before-completion, engineering defaults (think-before-coding, simplicity-first,
  surgical changes, goal-driven execution), AskUserQuestion clarify-first policy, coach-mode + skill-radar, "explain
  every term / validate every decision," the no-AI-tells writing rules.
- **Strip completely:** anything about my trading bots (Polymarket/PMv3/BTCMKR), psychology sessions, the
  consultant-retainer/$900 story, Revolut/SWIFT/wire details, client names (White Space, Nico, Jacopo, etc.),
  resume/salary/career, vault-specific paths, named personal tools. If it identifies me, my money, my health, or my
  clients — it does not ship.
- **Re-point** the examples at a real estate context so it reads like it was written for them.
- Deliverable: clean `claude-md.global.md` + a full old→new diff, flagging anything you were unsure whether to keep.

## Task 2 — Real estate agent (residential + commercial), opt-in goal
Build a bundled skill `assets/skills/real-estate/` and wire a new `GOALS` entry
(`{ value: 'realestate', label: 'Run my real estate business', ... }`) so each friend opts in at install. Add to
`BUNDLED_SKILLS` and the goal's `skills`.
Capabilities (reuse existing marketing/sales/copywriting/social skills where they fit — don't reinvent):
- **Residential:** listing descriptions, CMA summaries, buyer/seller email drafts, open-house plans, listing social posts, lead follow-up sequences, neighborhood/market research.
- **Commercial:** cap-rate / NOI / cash-on-cash / GRM calc helpers (**unit-tested**), LOI drafts, lease/tenant summaries, investment one-pagers.
- **Both:** plain-English contract/disclosure explainers **with a clear "not legal/financial advice" disclaimer**.
- Voice: professional, warm, no AI tells (per the CLAUDE.md writing rules).

## Task 3 — Gmail email agent
Build `assets/skills/email-assistant/` + wire a **Gmail MCP** into `src/data/mcp.js` and the real estate goal.
- Select a currently-maintained npx-installable Gmail MCP server; **verify it exists and runs before wiring** (don't assume a package name). OAuth is per-user, interactive at setup — add a clear wizard prompt, and make the step **fail loud** if auth isn't completed rather than registering a dead server.
- Capabilities: inbox triage, thread summarize, draft replies in the user's voice, flag hot leads, extract showings/action-items, follow-up reminders — tuned for a real estate workflow.
- **Safety gate:** drafts only. Never send/archive/delete without explicit per-action confirmation. Bake into the skill instructions.

## Task 4 — Full skill stack: superpowers + caveman + entire ECC library
- superpowers and caveman are already in `CORE` — confirm they install.
- Add the **full ECC library** (`{{ECC_REPO_URL}}` — confirm the URL with me first). Wire it as a marketplace in
  `MARKETPLACES` + install its plugins, or git-clone its skills into the skills dir — whichever the repo's structure
  supports. Install **everything** it ships; do not curate.
- Because ECC is large: make sure the install step doesn't hang or silently truncate — add a real completion check and
  paste the count of ECC skills/plugins that actually registered. If some fail, list which and why (don't hide it).

## Task 5 — Installer tweaks for this build
- Skip `Anthropic.Claude` (desktop already installed); keep Obsidian, Node, Git, Claude Code CLI.
- Keep the Git-path race fix and `$ErrorActionPreference='Continue'` — do not regress them.
- Add a plan/auth hard-gate: a free-tier sign-in stops with a clear "upgrade to Pro/Max first" message instead of installing nothing silently.

## Task 6 — Verify end to end
Produce every item in **SUCCESS CRITERIA** with pasted proof. Nothing is "done" until that block is fully green.

# STOP POINTS
Stop for my approval (1) after Task 0's written plan, and (2) before any destructive action. Otherwise proceed
task-by-task, verifying each before moving on.
