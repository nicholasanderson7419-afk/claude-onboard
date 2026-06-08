# claude-onboard — Resume State (2026-06-08)

## Product direction
Digital product: "all-in-one Claude vibe-coder install." MVP = **one-line installer** (no zip). Repo PUBLIC.
- Repo: https://github.com/nicholasanderson7419-afk/claude-onboard (PUBLIC)
- **Windows:** `irm https://raw.githubusercontent.com/nicholasanderson7419-afk/claude-onboard/master/install.ps1 | iex`
- **Mac/Linux:** `curl -fsSL https://raw.githubusercontent.com/nicholasanderson7419-afk/claude-onboard/master/install.sh | bash`

## ✅ WINDOWS INSTALLER — DONE + VALIDATED LIVE (2026-06-08)
Ran clean end-to-end on a fresh Windows desktop, ONE line, ONE pass:
- Installed Claude app + Obsidian app + Node + Git via winget.
- **One-pass sign-in** worked (`claude auth login` → browser → "Login successful" → auto-continued). No re-run.
- **OneDrive Desktop resolved** correctly (configured to `OneDrive\Desktop\Projects` via `[Environment]::GetFolderPath('Desktop')` + `--project` passed to wizard).
- All 9 plugins installed + enabled; vault + memory + QMD + North Star + /om-standup + llm-council + 7 trading skills — **"All steps verified," zero ✗.**
- 93 automated tests pass.

### Fixes that got it there (all pushed)
- `--express` no-questions wizard mode.
- Installers add Claude app + Obsidian app + Claude CLI + Node + Git (+Python on Win).
- One-pass sign-in via `claude auth login`; auth check `claude auth status` ("loggedIn":true).
- PATH fix: force `~/.local/bin` (where claude.exe lives) onto session PATH after winget; fallback "open new window."
- OneDrive-safe Desktop: installer resolves real Desktop + passes `--project` to wizard.
- Plugin-list parser marker-tolerant (❯ or >); verify trusts install success (no false "not found").
- install.ps1 is ASCII-only (em-dash broke parsing); both scripts syntax-checked.

### Remaining 1% (low risk)
- The test machine still had the Claude CLI (`claude: already installed`), so the **brand-new-claude-from-zero install path wasn't exercised**. Standard winget pkg; validate on a machine that never had Claude.

## NEXT (pick one)
1. **Concierge goal-interview** (Nick's idea, recommended UX upgrade): ask "what do you want to do?" in plain English → auto-pick + explain plugins (NO plugin jargon). Keep `--express` as the "skip" fast lane. Bonus: feed North Star goals to Claude to auto-recommend.
2. **Full Obsidian second brain** (deferred — make vault IDENTICAL to Nick's): bundle his 5 community plugins + clean `.obsidian` config into `assets/obsidian/`; wizard copies into the new vault. Plugins: smart-connections (Karpathy embeddings), dataview, templater-obsidian, obsidian-mindmap-nextgen, obsidian-local-llm-helper. EXCLUDE embeddings (huge, auto-regen). SCAN+STRIP any API keys in plugin data.json. (Obsidian APP itself already installs.)
3. **Landing page** (sub-project #2 — makes it sellable).
4. **Test Mac** live (only Windows proven).

## Known follow-ups
- Mac `install.sh` untested live (nvm pin v0.40.1; Obsidian via brew cask).
- Two-pass fallback still exists if claude not on PATH (rare now).
