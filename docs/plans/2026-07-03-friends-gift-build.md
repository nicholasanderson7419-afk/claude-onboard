# Plan — friends-gift build (2026-07-03)

Goal: two realtor friends run one paste → sanitized CLAUDE.md, real estate agent, Gmail email
agent, superpowers + caveman + full ECC, Obsidian + vault. Approval: standing ("run this prompt
and finish it").

## Decisions made during research (with evidence)

1. **ECC integration = plugin marketplace, not clone.** Verified by cloning
   `affaan-m/everything-claude-code` (⭐ ~186k, v2.0.0): ships `.claude-plugin/marketplace.json`
   defining one `ecc` plugin at repo root (277 skills, 92 commands, 67 agents). So: add `ecc`
   marketplace + `ecc` plugin to `CORE` in `src/data/plugins.js` — the existing step-03 machinery
   installs and verifies it. Hooks are NOT auto-wired by its plugin.json (checked) — no
   third-party shell execution lands on the friends' machines.
2. **Gmail = Anthropic's first-party claude.ai Gmail connector, NOT a custom MCP server.**
   Every alternative fails the non-technical-user test (verified 2026-07-03): Google's official
   remote Gmail MCP is Developer Preview and requires each END USER to create a GCP project +
   OAuth client + consent screen; GongRzhe-family npx servers need a user-supplied
   `gcp-oauth.keys.json`; Composio needs a paid third-party key. The first-party connector is
   one click + Google sign-in, official, and exposes draft-creation but **no send tool** — the
   drafts-only safety gate enforced at the API level. Deviation from the prompt's "wire into
   `src/data/mcp.js`" mechanism, kept deliberately; the skill self-checks for connector tools and
   prints exact enable steps when absent (fail-loud at point of use — account-level connectors
   don't show in `claude mcp list`).
3. **Plan gate is implementable:** `claude auth status` returns `"subscriptionType": "max"`.
   Gate: `free` → hard stop with upgrade message; missing field → loud warn, continue.
4. **Both bundled agents are goal-gated** via a `bundled` selection in step 06e (guided:
   implied by the `realestate` goal; express/no-TTY: installed by default).

## Build list

| # | Change | File(s) |
|---|--------|---------|
| 1 | Sanitized operating-manual CLAUDE.md (keep `{{PLUGIN_RULES}}`) | `src/templates/claude-md.global.md` |
| 2 | Real estate skill + unit-tested calc helpers | `assets/skills/real-estate/{SKILL.md,scripts/calc.mjs}`, `tests/skills/real-estate-calc.test.js` |
| 3 | Email assistant skill (drafts-only, connector self-check) | `assets/skills/email-assistant/SKILL.md` |
| 4 | ECC marketplace + CORE plugin | `src/data/plugins.js` |
| 5 | `realestate` goal (extras: elements-of-style, obsidian; skills: real-estate, email-assistant, om-commands) | `src/data/goals.js` |
| 6 | `BUNDLED_SKILLS` = both agents; goal-gating in 06e | `src/data/skills.js`, `src/steps/06e-skills.js` |
| 7 | Installer: skip desktop app, Pro/Max gate, Gmail next-step line | `install.ps1` |
| 8 | Tests updated for all of the above | `tests/data/*.test.js`, `tests/steps/06e-skills.test.js` |

## Verification map (success criteria → proof)
- npm test pass count → run locally.
- Sanitize grep (polymarket, revolut, psychology, retainer, whitespace, salary, PMv3, BTCMKR,
  Nico, Jacopo, SWIFT…) → empty, pasted.
- Calc invocation → run `node assets/skills/real-estate/scripts/calc.mjs` demo, pasted.
- Listing draft + email dry-run → produced against the shipped skill instructions, pasted.
- Plugin/MCP lists on a clean machine → **desktop clean-room run** (this laptop must not be
  modified — hard constraint). Same pending run also confirms the 7106f64 git-path fix.
