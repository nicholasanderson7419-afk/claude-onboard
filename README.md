# claude-onboard 🚀

A friendly setup wizard that gets **Claude Code** fully configured for you — plugins, memory files, a notes "second brain" with **semantic search**, your personal **North Star** goals, plus optional extra skills and workflow commands. You just answer a few questions.

**Jump to your computer:** [🪟 Windows](#-windows) · [🍎 Mac](#-mac) · [🐧 Linux](#-linux)

> **Before anything:** you need a **paid Claude plan** (Pro, Max, Team, or Enterprise). The free plan does **not** include Claude Code. → https://claude.com/pricing

Each track below is complete on its own — do all 5 steps for your OS, top to bottom. Never used a terminal? Just copy-paste exactly what you see.

---

# 🪟 Windows

### Step 1 — Install the tools (winget)
Windows 10/11 has **winget** built in. Open **PowerShell** (click **Start**, type **PowerShell**, press **Enter**), then paste these **one at a time** (press **Enter** after each; click **Yes** if Windows asks permission):
```
winget install Anthropic.ClaudeCode
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install GitHub.cli
winget install Python.Python.3.14
```
Then **close PowerShell and open a NEW one** so the new commands are found.

### Step 2 — Sign in & check
1. Get the desktop app: **https://claude.ai/download** — install and sign in.
2. Sign in the CLI: type `claude`, press **Enter**, log in via the browser.
3. Confirm each prints a version number:
   ```
   claude --version
   node --version
   git --version
   ```

### Step 3 — Get the project (git, no zip)
```
gh auth login
```
Choose **GitHub.com → HTTPS → Login with a web browser**. Then clone into your home base:
```
cd $HOME\Desktop ; mkdir Projects\vault -Force ; cd Projects
gh repo clone nicholasanderson7419-afk/claude-onboard
cd claude-onboard
```

### Step 4 — Run the wizard
```
npm install
node bin/cli.js
```
Answer the questions — **arrow keys** move, **Space** ticks/unticks, **Enter** confirms. For folders use `Desktop\Projects` (project) and `Desktop\Projects\vault` (vault). Any error gives **Retry / Skip / Stop** — nothing breaks.

### Step 5 — Start using Claude
1. Fully quit the Claude app and reopen it (so plugins load).
2. **Code** tab → **New Project** → **Use an existing folder** → pick `Desktop\Projects`.
3. In the prompt type `/om-standup` for a focused daily kickoff.

---

# 🍎 Mac

### Step 1 — Install the tools
1. **Desktop app:** https://claude.ai/download — open it, drag **Claude** into Applications, launch, sign in. (Blocked — *"unidentified developer"*? Right-click the app → **Open** → **Open** again, once.)
2. **Claude CLI:** open **Terminal** (⌘ Space, type *Terminal*, Enter), paste:
   ```
   curl -fsSL https://claude.ai/install.sh | bash
   ```
   If a box asks to install *command line developer tools*, click **Install**, wait, then paste the line again. When it finishes, **close Terminal and open a new window**.
3. **Node.js** (the wizard runs on it — **not** bundled with Claude): go to **https://nodejs.org**, click the big **LTS** button, open the downloaded `.pkg`, click **Continue → Agree → Install**.

### Step 2 — Sign in & check
1. Sign in the CLI: type `claude`, press **Return**, log in via the browser.
2. Confirm each prints a version number:
   ```
   claude --version
   node --version
   ```

### Step 3 — Get the project (git, no zip)
```
gh auth login
```
Choose **GitHub.com → HTTPS → Login with a web browser**. (If `gh` is missing: `brew install gh` first.) Then clone into your home base:
```
mkdir -p ~/Desktop/Projects/vault && cd ~/Desktop/Projects
gh repo clone nicholasanderson7419-afk/claude-onboard
cd claude-onboard
```

### Step 4 — Run the wizard
```
npm install
node bin/cli.js
```
Answer the questions — **arrow keys** move, **Space** ticks/unticks, **Return** confirms. For folders use `~/Desktop/Projects` and `~/Desktop/Projects/vault`. Any error gives **Retry / Skip / Stop** — nothing breaks.

### Step 5 — Start using Claude
1. Fully quit the Claude app (⌘ Q) and reopen it (so plugins load).
2. **Code** tab → **New Project** → **Use an existing folder** → pick `Desktop/Projects`. (Older builds: **Select folder**.)
3. In the prompt type `/om-standup` for a focused daily kickoff.

---

# 🐧 Linux

> Commands below are for **Debian/Ubuntu** — adjust for your distro. Linux assumes you're comfortable in a terminal.

### Step 1 — Install the tools
1. **Claude CLI** (the native installer supports Linux):
   ```
   curl -fsSL https://claude.ai/install.sh | bash
   ```
2. **Git & Python:**
   ```
   sudo apt update && sudo apt install -y git python3 python3-pip
   ```
3. **Node.js 18+** — distro packages are often too old, so use **nvm** or **NodeSource**:
   - nvm: https://github.com/nvm-sh/nvm#installing-and-updating then `nvm install --lts`
   - or NodeSource: https://github.com/nodesource/distributions
4. **GitHub CLI** (`gh`): https://github.com/cli/cli#installation
5. Get the desktop app if your distro supports it: https://claude.ai/download (otherwise the CLI is enough).

### Step 2 — Sign in & check
1. Sign in the CLI: type `claude`, press **Enter**, log in via the browser.
2. Confirm each prints a version number:
   ```
   claude --version
   node --version
   ```

### Step 3 — Get the project (git, no zip)
```
gh auth login
```
Choose **GitHub.com → HTTPS → Login with a web browser**. Then clone into your home base:
```
mkdir -p ~/Desktop/Projects/vault && cd ~/Desktop/Projects
gh repo clone nicholasanderson7419-afk/claude-onboard
cd claude-onboard
```

### Step 4 — Run the wizard
```
npm install
node bin/cli.js
```
Answer the questions — **arrow keys** move, **Space** ticks/unticks, **Enter** confirms. For folders use `~/Desktop/Projects` and `~/Desktop/Projects/vault`. Any error gives **Retry / Skip / Stop** — nothing breaks.

### Step 5 — Start using Claude
1. Restart the Claude app (or open a fresh terminal session) so plugins load.
2. Point Claude at `~/Desktop/Projects` (in the app: **Code** tab → **New Project** → **Use an existing folder**).
3. Type `/om-standup` for a focused daily kickoff.

---

# What the wizard sets up (all platforms)

- **Plugins** — superpowers (planning, TDD, debugging, code review), caveman (terse mode), session tools, ask-clarifying-questions, debugging — plus optional ones (elements-of-style, journal, security review, gh integration, video, obsidian).
- **CLAUDE.md instructions** — global + project, so Claude understands you.
- **A startup hook** — shows today's date + project on every launch.
- **An Obsidian-style "second brain" vault** wired into Claude (remembers across sessions). Only the one folder you pick — never your whole drive.
- **Your North Star goals** + the `/om-standup` daily kickoff command.
- **QMD** — private semantic search over your notes, runs entirely on your machine.
- **Optional MCP servers** — browser automation (playwright), agent orchestration (ruflo, claude-flow).
- **Optional extra skills** — `llm-council` (a 5-advisor decision council) and the `om-*` command suite. In guided mode, the plugins, MCP servers, and skills are tailored to the goals you pick.

# Is it safe?
Yes — it **backs up** any file before changing it, **never overwrites** your notes, and is **safe to re-run** (it skips anything already done). If a step fails you get **Retry / Skip / Stop**, never a crash.

# Troubleshooting
- **`command not found` for `claude` / `node` / `npm` / `gh`** → that tool isn't installed (or the terminal is stale). Reinstall it from Step 1 for your OS, then **open a fresh terminal**.
- **macOS blocks the app** → right-click → **Open** → **Open** again, or **System Settings → Privacy & Security → Open Anyway**.
- **`gh repo clone` fails / "repository not found"** → you need to be invited to the private repo. Ask Nick to add you as a collaborator.
- **A wizard step errors** → pick **Skip** or **Retry**, screenshot it, and text Nick. Nothing is broken.

# Requirements recap
- **Mac**, **Windows 10/11**, or **Linux**.
- A **paid Claude plan** (Pro/Max/Team/Enterprise).
- **Node.js 18+** (installed in Step 1 — it does **not** come with Claude Code).

---

### For the technically curious
Built as a Node.js CLI, fully test-driven (90 automated tests including an end-to-end test). Run `npm test` to see them. The real `claude` CLI calls were validated read-only via `npm run smoke`. The `ffmpeg`-for-video dependency is auto-installed only if you pick the video plugin.
