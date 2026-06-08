#!/usr/bin/env bash
# claude-onboard - one-line installer for macOS / Linux
# Usage (interactive - recommended, keeps the keyboard live for sign-in + questions):
#   bash <(curl -fsSL https://raw.githubusercontent.com/nicholasanderson7419-afk/claude-onboard/master/install.sh)
#
# NOTE: intentionally NO `set -e`. Each step handles its own failure so one
# flaky sub-step (nvm, brew) can never silently kill the whole run and leave a
# half-done machine that looks "complete". Real failures call die() = loud exit 1.

say()  { printf "\n>>> %s\n" "$1"; }
warn() { printf "  [!] %s\n" "$1" >&2; }
die()  { printf "\n[FAILED] %s\n" "$1" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

LOCAL_BIN="$HOME/.local/bin"

# Put ~/.local/bin (where the Claude CLI lands) on PATH for THIS run.
use_local_bin_now() {
  case ":$PATH:" in
    *":$LOCAL_BIN:"*) : ;;
    *) [ -d "$LOCAL_BIN" ] && export PATH="$LOCAL_BIN:$PATH" ;;
  esac
  hash -r 2>/dev/null || true   # drop any cached "command not found" for claude
}

# Persist ~/.local/bin on PATH for FUTURE terminals (idempotent).
persist_local_bin() {
  line='export PATH="$HOME/.local/bin:$PATH"'
  # macOS default shell is zsh; .zshrc is read by interactive terminals. Create if missing.
  if ! grep -qs '\.local/bin' "$HOME/.zshrc"; then
    printf '\n# added by claude-onboard\n%s\n' "$line" >> "$HOME/.zshrc"
  fi
  # also cover login-shell / bash profiles if they already exist
  for rc in "$HOME/.zprofile" "$HOME/.bash_profile" "$HOME/.bashrc"; do
    [ -f "$rc" ] && { grep -qs '\.local/bin' "$rc" || printf '\n# added by claude-onboard\n%s\n' "$line" >> "$rc"; }
  done
}

printf "\n=== claude-onboard: all-in-one Claude setup ===\n"

say "Installing Claude Code"
if ! have claude && [ ! -x "$LOCAL_BIN/claude" ]; then
  curl -fsSL https://claude.ai/install.sh | bash || warn "claude installer returned an error - re-checking PATH"
fi
use_local_bin_now
persist_local_bin
if ! have claude; then
  die "Claude Code did not install. Open a NEW terminal, run 'claude --version'; if missing, re-run this installer."
fi
printf "  claude: %s\n" "$(claude --version 2>/dev/null || echo present)"

say "Installing Node.js (if needed)"
need=1
if have node; then
  major="$(node -v 2>/dev/null | sed 's/v\([0-9]*\).*/\1/')"
  [ -n "$major" ] && [ "$major" -ge 18 ] 2>/dev/null && need=0
fi
if [ "$need" -eq 1 ]; then
  export NVM_DIR="$HOME/.nvm"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash || warn "nvm install script returned an error"
  fi
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh" 2>/dev/null || warn "could not source nvm"
  nvm install --lts >/dev/null 2>&1 && nvm use --lts >/dev/null 2>&1 || warn "nvm install --lts had a problem"
fi
if ! have node; then
  die "Node.js could not be installed. Install Node 18+ from https://nodejs.org, open a NEW terminal, then re-run this installer."
fi
printf "  node: %s\n" "$(node -v)"

say "Installing Git (if needed)"
if ! have git; then
  if [ "$(uname)" = "Darwin" ]; then
    warn "git not found - a macOS dialog will ask to install the Command Line Tools."
    xcode-select --install 2>/dev/null || true
    die "Finish the Command Line Tools install (the popup), then re-run this installer."
  else
    sudo apt-get update && sudo apt-get install -y git || die "could not install git"
  fi
fi

say "Installing Obsidian (notes app - optional)"
if have brew; then
  brew install --cask obsidian >/dev/null 2>&1 || warn "Obsidian via brew failed - install later from https://obsidian.md"
else
  printf "  (optional) install Obsidian from https://obsidian.md\n"
fi

say "Signing in to Claude"
claude_authed() { claude auth status 2>/dev/null | grep -Eq '"loggedIn"[[:space:]]*:[[:space:]]*true'; }
if ! claude_authed; then
  printf "  A sign-in will open - log into your Anthropic account, then come back here.\n"
  claude auth login || true
fi
if ! claude_authed; then
  die "Not signed in. Run 'claude auth login' (needs a Claude Pro/Max/Team plan), then re-run this installer."
fi
printf "  signed in.\n"

say "Getting the setup"
BASE="$HOME/Desktop/Projects"
DEST="$BASE/claude-onboard"
mkdir -p "$BASE" || die "could not create $BASE"
if [ -d "$DEST/.git" ]; then
  git -C "$DEST" pull --quiet || warn "could not update existing copy - using what's there"
else
  git clone --depth 1 https://github.com/nicholasanderson7419-afk/claude-onboard.git "$DEST" || die "could not download the setup (git clone failed)"
fi
cd "$DEST" || die "could not enter $DEST"

say "Configuring everything (a couple quick questions to tailor it)"
npm install --silent || die "npm install failed"
node bin/cli.js --guided --project "$BASE" || die "the setup wizard hit an error"

printf "\n[OK] All set! Open a NEW terminal (so 'claude' is on PATH), then open the Claude app -> Code -> open Desktop/Projects -> type /om-standup\n\n"
