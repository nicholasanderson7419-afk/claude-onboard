# claude-onboard — Resume State (2026-06-08)

## Product: "all-in-one Claude vibe-coder install"
- Repo (PUBLIC): https://github.com/nicholasanderson7419-afk/claude-onboard
- **Landing page (waitlist):** https://nicholasanderson7419-afk.github.io/claude-onboard/
- Windows: `irm https://raw.githubusercontent.com/nicholasanderson7419-afk/claude-onboard/master/install.ps1 | iex`
- Mac/Linux: `curl -fsSL https://raw.githubusercontent.com/nicholasanderson7419-afk/claude-onboard/master/install.sh | bash`
- 100 automated tests pass.

## ✅ DONE
- **Windows installer** — validated live end-to-end on a fresh machine (one line, one pass, OneDrive-safe, all 9 plugins, all steps verified).
- **Phase 2 — Full Obsidian second brain:** bundles 5 community plugins (smart-connections, dataview, templater-obsidian, obsidian-mindmap-nextgen, obsidian-local-llm-helper) into the new vault's `.obsidian` (code only — no personal data.json, no embeddings). assets/obsidian/ (~14MB).
- **Phase 1 — Concierge `--guided` mode:** asks ONE plain-English goal question ("what do you want to do?") -> maps to plugins (no jargon). Falls back to recommended defaults if terminal can't prompt. `--express` still exists (zero-question). Installer now runs `--guided`. Goal->plugin map in src/data/goals.js.
- **Phase 3 — Landing page + waitlist:** index.html (hero, OS-toggle one-liner + copy, what-you-get, how-it-works, email form). GitHub Pages enabled (master/root).

## ⚠️ OPEN / NEEDS ACTION
1. **Waitlist email capture NOT live yet** — index.html form posts to `https://formspree.io/f/YOUR_FORM_ID` (placeholder). Nick: make a free Formspree form (formspree.io, ~2 min), replace `YOUR_FORM_ID` in index.html. Until then signups go nowhere.
2. **`--guided` one-liner prompt UNTESTED live** — the goal question via `irm|iex -> node` (interactive @clack) hasn't been run on a real machine yet. Logic is tested (100 tests) + has a no-TTY fallback to defaults, so worst case = no question + defaults (won't break). Confirm on next fresh run; if the prompt won't render, revert installer to `--express` (one-word change).
3. **Phase 4 — Mac test: BLOCKED** — no Mac tester/machine. install.sh written + syntax-checked, NOT run live (nvm pin v0.40.1; Obsidian via brew cask; claude installs to ~/.local/bin). Needs a real Mac user.
4. claude-from-zero install path still unproven (test machine had claude lingering).

## NEXT SUB-PROJECTS
- Monetization (after waitlist shows demand): free vs paid, license gate, Stripe.
- True 1-click GUI installer (Phase-2 of the original plan) if demand warrants.
- Extend concierge: let the goal answer also drive MCP servers + skills (currently drives plugins only).
