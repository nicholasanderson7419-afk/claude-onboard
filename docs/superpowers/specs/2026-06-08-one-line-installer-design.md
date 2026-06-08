# One-Line Installer — Design Spec (MVP / sub-project 1)

**Date:** 2026-06-08
**Status:** approved (verbal) — building

## Goal
Replace the current ~15-step manual setup with a **single command the user pastes**. One paste → Claude Code + Node + Git + the claude-onboard config installed and configured in ~2 minutes, with no further questions.

## In scope (this sub-project)
1. `install.sh` (macOS/Linux) and `install.ps1` (Windows) — bootstrap scripts.
2. `--express` non-interactive mode added to the wizard (sane defaults, no prompts).
3. Make the GitHub repo **public** so the scripts can fetch it without a login.

## Out of scope (later sub-projects)
Landing page, payments / license gating, the GUI 1-click app, custom domain.

## The one command
- **macOS/Linux:** `curl -fsSL <raw-url>/install.sh | bash`
- **Windows:** `irm <raw-url>/install.ps1 | iex`

(`<raw-url>` = GitHub raw for the MVP; pretty domain comes with the landing page.)

## What the script does (fully automated)
1. Detect OS.
2. Install **Claude Code** (native installer; `winget install Anthropic.ClaudeCode` on Windows).
3. Ensure **Node 18+** (Windows: `winget install OpenJS.NodeJS.LTS`; macOS/Linux: nvm — no sudo password needed).
4. Ensure **Git** (Windows: also Python 3.14 via winget).
5. Download the claude-onboard config (public repo) into `~/Desktop/Projects/claude-onboard`.
6. Run `node bin/cli.js --express` → installs the recommended plugins, memory + search, vault, and North Star with default answers.
7. Print: `✅ done — open Claude, click Code, pick Desktop/Projects, type /om-standup`.

## Express-mode defaults
- Project folder `~/Desktop/Projects`, vault `~/Desktop/Projects/vault`.
- Plugins: the 6 core + recommended optional.
- MCP: memory + qmd (search) + vault. (playwright/ruflo/claude-flow stay opt-in.)
- Skills/commands: llm-council + the om-* command suite. (trading skills opt-in.)
- North Star: a friendly placeholder the user edits later.
- Every choice still overridable by running the wizard normally (no `--express`).

## Success criteria
On a fresh machine, **one paste finishes with Claude Code working and the config in place — no manual steps, no crash.** Each install step is verified; a failure prints a plain-English message and continues where safe (Retry/Skip/Stop already exists).

## Risks / watch-items
- Silent Node install on macOS without Homebrew → use **nvm** (avoids sudo).
- `curl|bash` / `irm|iex` user trust + Windows execution policy → run with `-ExecutionPolicy Bypass`; landing page builds trust later.
- The repo going public exposes the bundled config (already scanned — no secrets).
