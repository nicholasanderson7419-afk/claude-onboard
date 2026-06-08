#!/usr/bin/env bash
# claude-onboard — one-line installer for macOS / Linux
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/nicholasanderson7419-afk/claude-onboard/master/install.sh | bash
set -e
say()  { printf "\n>>> %s\n" "$1"; }
have() { command -v "$1" >/dev/null 2>&1; }

printf "\n=== claude-onboard: all-in-one Claude setup ===\n"

say "Installing Claude Code"
if ! have claude; then curl -fsSL https://claude.ai/install.sh | bash; fi
[ -d "$HOME/.local/bin" ] && export PATH="$HOME/.local/bin:$PATH"

say "Installing Node.js (if needed)"
need=1
if have node; then [ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -ge 18 ] && need=0; fi
if [ "$need" -eq 1 ]; then
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] || curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm install --lts
fi

say "Installing Git (if needed)"
if ! have git; then
  if [ "$(uname)" = "Darwin" ]; then xcode-select --install || true
  else sudo apt-get update && sudo apt-get install -y git; fi
fi

say "Installing Obsidian (notes app)"
if command -v brew >/dev/null 2>&1; then brew install --cask obsidian || true
else printf "  (optional: install Obsidian from https://obsidian.md)\n"; fi

say "Signing in to Claude"
claude_authed() { claude auth status 2>/dev/null | grep -Eq '"loggedIn"[[:space:]]*:[[:space:]]*true'; }
if ! claude_authed; then
  printf "  A sign-in will open — log into your Anthropic account...\n"
  claude auth login || true
fi
if ! claude_authed; then
  printf "  Not signed in yet. Run 'claude auth login', then re-run this installer.\n"
  exit 0
fi

say "Getting the setup"
mkdir -p "$HOME/Desktop/Projects"
DEST="$HOME/Desktop/Projects/claude-onboard"
if [ -d "$DEST/.git" ]; then git -C "$DEST" pull --quiet
else git clone --depth 1 https://github.com/nicholasanderson7419-afk/claude-onboard.git "$DEST"; fi
cd "$DEST"

say "Configuring everything (no questions — recommended defaults)"
npm install --silent
node bin/cli.js --express

printf "\n[OK] All set! Open the Claude app -> Code -> open Desktop/Projects -> type /om-standup\n\n"
