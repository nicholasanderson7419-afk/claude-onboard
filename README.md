# claude-onboard 🚀

A friendly setup wizard that gets **Claude Code** fully configured for you — plugins, memory files, a notes "second brain" with **semantic search**, and your personal **North Star** goals — all by answering a few simple questions. No technical knowledge needed.

Works on **Mac** and **Windows**. Never used a terminal? Just copy-paste exactly what you see. **Windows → do Part 1 (Windows). Mac → do Part 1 (Mac).** Parts 2–3 are the same for both.

---

## Part 1 (Windows) — install everything with winget (fast)

Windows 10/11 has **winget** built in. This installs Claude Code, Node.js, Git, GitHub CLI, and Python in one shot.

1. You need a paid Claude plan (Pro/Max): https://claude.com/pricing
2. Open **PowerShell**: click **Start**, type **PowerShell**, press **Enter**.
3. Paste these **one at a time**, pressing **Enter** after each (click **Yes** if Windows asks permission):
   ```
   winget install Anthropic.ClaudeCode
   winget install OpenJS.NodeJS.LTS
   winget install Git.Git
   winget install GitHub.cli
   winget install Python.Python.3.14
   ```
4. **Close PowerShell and open a NEW one** (so the new commands are found).
5. Get the desktop app too: **https://claude.ai/download** — install and sign in.
6. Sign in the CLI: type `claude`, press **Enter**, log in via the browser.
7. Check it worked — each should print a version number:
   ```
   claude --version
   node --version
   git --version
   python --version
   ```

➡️ **Windows users: now skip to [Part 2](#part-2--run-the-setup-wizard).** (Everything else is the same — just use PowerShell instead of Terminal.)

---

## Part 1 (Mac) — Get Claude Code first (one-time, before the wizard)

The wizard sets up **Claude Code**. So you need Claude Code installed and signed in first.

> **You need a paid plan.** Claude Code requires a **Pro, Max, Team, or Enterprise** subscription. The free Claude plan does **not** include it. (https://claude.com/pricing)

There are two pieces, and for this wizard you want **both**:
- **The Desktop app** — the nice point-and-click version of Claude Code you'll actually use day to day.
- **The Terminal CLI** — a command-line version. **The wizard runs through this**, so you need it even though you'll mostly use the app.

Good news: they **share the same settings**. Everything this wizard sets up through the CLI automatically shows up in the Desktop app too. Set it up once, get it everywhere.

### Step A — Install the Desktop app (the GUI you'll use)
1. Download it for Mac: **https://claude.ai/download**
2. Open the downloaded file and drag **Claude** into your Applications folder.
3. Launch **Claude** from Applications and **sign in** with your account.
   - If macOS says *"Claude can't be opened because it is from an unidentified developer"*, right-click the app → **Open** → **Open** again. (You only do this once.)
4. Click the **Code** tab at the top. If it asks you to upgrade, you're on the free plan — you'll need a paid one (see above).

✅ You can now use Claude Code with a nice interface.

### Step B — Install the Terminal CLI (so the wizard can run)
1. Open the **Terminal** app:
   - Press **⌘ Command + Space** (opens Spotlight search).
   - Type **Terminal**, press **Return**. A window with text appears — this is where you paste commands and press **Return** to run them.
2. Copy-paste this exact line and press **Return**:
   ```
   curl -fsSL https://claude.ai/install.sh | bash
   ```
   Wait for it to finish. **If a box pops up asking to install *command line developer tools*, click Install, let it finish, then paste the line again.**
3. **Close the Terminal window and open a new one** (the new command only works in a fresh window).
4. Type this and press **Return** to sign in:
   ```
   claude
   ```
   It opens a browser sign-in. Log in. Once connected, you can leave it — or press **Control + C** to exit back to the terminal.
5. Confirm it's working — type:
   ```
   claude --version
   ```
   If you see a version number, you're set. If you see "command not found", close and reopen Terminal and try again.

### Step C — Install Node.js (the wizard runs on it)
The wizard is a small **Node.js** program, so you need Node installed. It does **not** come with Claude Code — you install it yourself, once:
1. Go to **https://nodejs.org** and click the big **LTS** button (downloads the macOS Installer, a `.pkg` file).
2. Open the downloaded `.pkg` and click through **Continue → Agree → Install** (enter your Mac password if asked).
3. Check it worked — in Terminal type:
   ```
   node --version
   ```
   A number like `v20.x` (anything 18 or higher) means you're set. If it says *command not found*, close Terminal, open a new window, and try again.

✅ **You now have Claude Code (app + terminal) and Node.js — signed in and ready.** On to the wizard.

---

## Part 2 — Run the setup wizard

### First: make your "home base" folder
Claude works best when everything you do lives in **one folder you point it at**. Make it now so it's ready when the wizard asks:
1. Open **Finder**.
2. Go to your **Desktop**.
3. Right-click an empty spot → **New Folder**. Name it **`Projects`** (or anything you like).
4. Open it and make **one folder inside it** named **`vault`** (this is where your notes/second-brain will live — it has to be its own folder, not the Desktop itself).

So you'll have:
```
Desktop/
  Projects/        ← your home base (you point Claude here for everything)
    vault/         ← your notes / "second brain"
```
When the wizard later asks for your **project folder**, give it `Desktop/Projects`. When it asks for your **vault folder**, give it `Desktop/Projects/vault`.

**How to type a folder path when asked:** the easiest way — type nothing, just **drag the folder from Finder into the Terminal** and it fills in the path for you. Or type it by hand like `~/Desktop/Projects` (the `~` means "my home folder").

### 1. Get the project with git (no zip)
You'll pull the project straight onto your machine — nothing to download or unzip. Use **PowerShell** (Windows) or **Terminal** (Mac).

1. **Sign in to GitHub (first time only).** You already have the GitHub CLI (`gh`) from Part 1.
   ```
   gh auth login
   ```
   Choose **GitHub.com → HTTPS → Login with a web browser** and follow the prompts.
   *(Mac only, if `gh` is missing: run `brew install gh` first.)*

2. **Make your home base and clone into it:**
   - **Windows (PowerShell):**
     ```
     cd $HOME\Desktop ; mkdir Projects\vault -Force ; cd Projects
     gh repo clone nicholasanderson7419-afk/claude-onboard
     ```
   - **Mac (Terminal):**
     ```
     mkdir -p ~/Desktop/Projects/vault && cd ~/Desktop/Projects
     gh repo clone nicholasanderson7419-afk/claude-onboard
     ```
   A `claude-onboard` folder appears inside `Desktop/Projects`.

### 2. Go into the folder
```
cd claude-onboard
```

### 3. Run these two lines (one at a time, press Return after each)
```
npm install
```
Wait for it to finish (a minute or so — it downloads what it needs). Then:
```
node bin/cli.js
```

### 4. Answer the questions
The wizard now walks you through everything below. Use **arrow keys** to move, **Space** to tick/untick checkboxes, and **Return** to confirm. When it asks for a folder, use your home-base folder from above (drag it in, or type `~/Desktop/Projects`).

If anything ever goes wrong, it asks **Retry / Skip / Stop** — nothing breaks. Just pick one (or text Nick what it said).

---

## Part 3 — Start actually using Claude

### 1. Restart Claude so the new plugins load
Newly installed plugins activate on a fresh start. **Fully quit the Claude app** (⌘ Q) and reopen it. If you also use the terminal version, close that window and open a new one.

### 2. Open your home-base folder in the app
1. Open the **Claude** app → click the **Code** tab.
2. Click **New Project** → **Use an existing folder** → pick **`Desktop/Projects`**. (On older versions this button says **Select folder**.)
3. That's it — Claude now sees your instructions (CLAUDE.md), your notes vault, and your plugins automatically.

### 3. Kick off with your North Star
In the prompt box, type:
```
/om-standup
```
Claude reads your North Star goals and gives you a focused daily kickoff, then asks what you want to work on. Use this to start every session.

### From now on
- Keep your work inside **`Desktop/Projects`** so Claude always has your context.
- Just talk to it in plain English in the **Code** tab — "build me a webpage that…", "fix this", "explain this file."
- Re-running the wizard later is safe; it won't duplicate anything.

---

## Troubleshooting (if a step errors)

- **"command not found: claude"** → close Terminal, open a new window, try again. If still missing, re-run the install line from Part 1 Step B.
- **"command not found: npm" or "node"** → Node.js isn't installed. Do **Part 1 Step C** (install from nodejs.org), then close Terminal, open a new window, and try again.
- **macOS blocks the app or installer** ("unidentified developer" / "cannot be opened") → right-click the app → **Open** → **Open** again. Or **System Settings → Privacy & Security** → scroll down → **Open Anyway**.
- **A wizard step fails** → pick **Skip** to keep going, or **Retry**. Then screenshot what it said and send it to Nick. Nothing is broken — the wizard backs up files and never deletes your notes.
- **It asks for a paid plan** → Claude Code needs Pro/Max/Team/Enterprise; the free plan won't work.
- **Want to start over?** → just run `node bin/cli.js` again. It's safe to re-run.

---

## What this wizard sets up (everything included)

### ✅ Step 0 — Checks Claude Code
Confirms Claude Code is installed and you're logged in. If not, it tells you how to fix it and stops safely.

### 🔧 Step 1 — Prerequisites
Installs **git** (version control, needed by some tools) if you don't have it.
- *Mac note:* if it can't install git automatically, macOS may pop up a box offering to install "developer tools" — click **Install**. That's normal.

### 🧩 Step 2 — Plugins (the power-ups for Claude)
You get a checklist. These **6 are pre-ticked** (recommended for everyone):

| Plugin | What it gives you |
|--------|-------------------|
| **superpowers** | The big one. Structured workflows: brainstorming ideas into plans, writing implementation plans, test-driven development, systematic debugging, and code review. Makes Claude work like a disciplined senior engineer. |
| **caveman** | A terse "smart caveman" reply mode that strips fluff and saves tokens/money. Toggle on/off anytime. |
| **claude-session-driver** | Helps Claude manage long work sessions and hand off cleanly between them. |
| **double-shot-latte** | Keeps useful context loaded across your sessions. |
| **ask-questions-if-underspecified** | Makes Claude ask you smart clarifying questions *before* it builds the wrong thing. |
| **debug-buttercup** | A step-by-step debugging method for when something's broken. |

And these are **optional** (tick the ones you want):

| Plugin | What it gives you |
|--------|-------------------|
| **elements-of-style** | Helps Claude write clearly and concisely. |
| **private-journal-mcp** | A private journal for decisions and reflections. |
| **agentic-actions-auditor** | Safety audit of risky actions before they run. |
| **differential-review** | Security-focused review of code changes. |
| **gh-cli** | GitHub integration (needs the `gh` tool — installed automatically if you pick this). |
| **code-review** | Anthropic's official code-review workflow (needs `gh`). |
| **claude-video-vision** | Lets Claude watch and analyze videos (needs `ffmpeg` — installed automatically if you pick this). |
| **obsidian** | Obsidian vault skills — work with markdown notes, canvas, bases, and the Obsidian CLI. |

### 📝 Step 3 — Your CLAUDE.md files (Claude's instructions & memory)
Asks you a few quick questions — your project folder, project name, a one-line description, any rules you care about — and writes:
- A **global** instructions file (how you like Claude to behave, everywhere).
- A **project** instructions file (what your specific project is about).

These are what make Claude actually understand *you* and *your work* every session.

### ⚡ Step 4 — A startup hook
Adds a small automation so that every time you start Claude, it shows today's date and which project branch you're on. (Little context Claude doesn't get on its own.)

### 🧠 Step 5 — Your Obsidian-style "Second Brain"
Optional but recommended. If you say yes:
- Creates a **notes vault** — a folder with `brain/`, `wiki/concepts/`, and `raw/` sections, plus a `MEMORY.md` index.
- **Wires it into Claude** so Claude can read and write your notes (this is the "second brain" — Claude remembers things across sessions by saving them here).
- Optionally adds a **knowledge-graph memory** server too.
- *(This is the same "Karpathy-style" notes setup serious Claude users build — raw notes turn into linked concepts, and Claude maintains the wiki for you. It pairs perfectly with the free Obsidian app from obsidian.md if you want a nice visual editor — but you don't need Obsidian installed; it's just folders and text files.)*
- 🔒 **Safety:** it only gives Claude access to the one folder you pick, and it won't let you pick something dangerous like your whole home folder.

### ⭐ Step 6 — Your North Star (the centerpiece)
This is the heart of it. The wizard interviews you:
- What's your **current focus** (one line)?
- Your **short-term** goals (this quarter)?
- **Medium-term** (this half)?
- **Long-term** (this year and beyond)?

It writes all of this into a `North Star.md` file **and** installs an **`/om-standup`** command. From then on, you can type `/om-standup` in Claude and it reads your North Star and gives you a focused daily kickoff — so Claude always knows what you're actually working toward.

### 🔎 Step 7 — Search (QMD)
Installs **QMD**, a private search engine over your notes, and points it at your home-base folder. It lets Claude **find the right note by meaning**, not just keywords — so as your second brain fills up, Claude can answer "where did I write about X?" instantly instead of reading every file. It pairs directly with your Second Brain (Step 5): the vault stores your notes, QMD searches them.
- It indexes everything automatically and runs **entirely on your computer** (private — nothing uploaded).
- **Heads up:** the first time you actually search a vault that has notes in it, QMD downloads its search "brain" (a few hundred MB, one time). At setup your vault is empty, so there's nothing to download yet — it just gets ready. The more notes you add, the more useful it gets.

### 🔌 Step 8 — Extra MCP servers (optional)
A checklist of optional tool servers for Claude — **none preselected**, pick only what you want:
- **playwright** — browser automation: navigate, click, screenshot, test web apps.
- **ruflo** — agent orchestration, memory, and swarms.
- **claude-flow** — swarms, memory, agents, and hive-mind coordination.

(The vault, knowledge-graph memory, and search servers are set up separately in Steps 5 and 7.)

### 🧩 Step 9 — Extra skills & commands (optional)
Power-ups beyond the marketplace plugins:
- **llm-council** — a 5-advisor "council" that pressure-tests a decision (independent analysis → anonymous peer-review → chairman synthesis). Cloned from its repo.
- **trading skills** — prediction-market + Itô analysis: prediction-market-oracle-research, prediction-market-risk-review, ito-trade-planner, ito-market-intelligence, ito-basket-compare, ito-data-atlas-agent, llm-trading-agent-security.
- **om-* command suite** — 17 second-brain slash commands (om-dump, om-weekly, om-wrap-up, om-vault-audit, 1-on-1 helpers…). `om-standup` is already added in Step 6.

### ⏰ Step 10 — Optional daily automation
If you want, it sets up a once-a-day scheduled Claude task. Totally optional — skip it if unsure.

### ✅ Step 11 — Summary
A clean ✓ / ✗ checklist showing exactly what got set up, with proof for each item.

---

## Is it safe?
Yes:
- It **backs up** any existing file before changing it.
- It **never overwrites** your notes.
- It's **safe to re-run** — it skips anything already done.
- If a step fails, you get **Retry / Skip / Stop**, never a crash that breaks things.

## Requirements recap
- A **Mac** or **Windows 10/11** PC.
- **Claude Code** installed and signed in (Part 1).
- **Node.js 18+** — install it yourself (Windows: `winget install OpenJS.NodeJS.LTS`; Mac: Part 1 Step C). It does **not** come with Claude Code.
- Windows winget also installs **Git, GitHub CLI, and Python 3.14** in Part 1.

## If you get stuck
Text Nick exactly what the Terminal says (a screenshot is perfect). The wizard is designed to fail safely, so you can't really break anything.

---

### For the technically curious
Built as a Node.js CLI, fully test-driven (90 automated tests including an end-to-end test). Run `npm test` to see them. The real `claude` CLI calls were validated read-only via `npm run smoke`. A pre-1.0 note: the `ffmpeg`-for-video dependency is auto-installed only if you pick the video plugin.
