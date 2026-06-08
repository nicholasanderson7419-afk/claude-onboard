# claude-onboard — Resume State (2026-06-08)

## Product direction
Digital product: "all-in-one Claude vibe-coder install." MVP = **one-line installer** (no zip), repo PUBLIC.
- Repo: https://github.com/nicholasanderson7419-afk/claude-onboard (PUBLIC)
- Windows line: `irm https://raw.githubusercontent.com/nicholasanderson7419-afk/claude-onboard/master/install.ps1 | iex`
- Mac/Linux line: `curl -fsSL .../install.sh | bash`

## DONE
- `--express` no-questions wizard mode (92 tests pass).
- install.ps1 / install.sh: install Claude app + Claude Code CLI + Node + Git (+ Python on Win) + Obsidian APP, clone repo, run express wizard.
- One-pass sign-in via `claude auth login`; auth check via `claude auth status` ("loggedIn":true).
- Plugin-list parser made marker-tolerant (❯ or >). Verify trusts install success.
- First fresh-machine run: ~everything worked; all 9 plugins installed+enabled (false "not found" was the parser bug, fixed).

## OPEN BUGS (fix next)
1. **PATH after winget**: right after winget installs Claude, `claude` not reliably on PATH in the SAME PowerShell session. Refresh-Path (registry read) insufficient on Nick's machine. Likely fix: add winget Links dir (`%LOCALAPPDATA%\Microsoft\WinGet\Links`) to session PATH, and/or if `claude` still not callable, instruct "open a NEW PowerShell and paste the line again."
2. **OneDrive Desktop redirection**: Nick's Desktop = `C:\Users\nicho\OneDrive\Desktop`, not `$HOME\Desktop`. Script's `$HOME\Desktop\Projects` may land wrong. Fix: resolve the real Desktop via `[Environment]::GetFolderPath('Desktop')`.
3. **Nick's personal env only (NOT a product bug)**: his OneDrive-synced `Microsoft.PowerShell_profile.ps1` has a `claude` wrapper expecting `claude.exe` → throws when claude not on PATH. A real new user won't have this. His test machine isn't truly fresh (OneDrive synced profile + Desktop).

## DEFERRED — Obsidian full second brain ("come back to this")
Make the vault IDENTICAL to Nick's machine. His vault (`Desktop/Projects/.obsidian`) runs 5 community plugins:
- smart-connections (Karpathy-style local embeddings; `.smart-env`)
- dataview (hierarchy indexing)
- templater-obsidian
- obsidian-mindmap-nextgen
- obsidian-local-llm-helper

Plan: bundle those 5 plugin builds + a clean `.obsidian` config (community-plugins.json + sane settings) into `assets/obsidian/`; wizard copies into the new vault's `.obsidian`. EXCLUDE embeddings (huge, auto-regenerate). SCAN + STRIP any API keys in plugin `data.json` before bundling. Smart Connections re-indexes on the new machine.

## NEXT SUB-PROJECTS (after installer solid)
2. Landing page (sells config, hosts one line). 3. Monetization. 4. Marketing.
