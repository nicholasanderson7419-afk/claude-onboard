# claude-onboard 🚀

A friendly setup wizard that gets **Claude Code** fully configured for you — plugins, memory files, a notes "second brain," and your personal **North Star** goals — all by answering a few simple questions. No technical knowledge needed.

This guide assumes you're on a **Mac** and have never used the Terminal before. Just follow along in order.

---

## Part 1 — Get Claude Code first (one-time, before the wizard)

The wizard sets up Claude Code, so you need Claude Code installed and signed in first.

### 1. Open the Terminal app
- Press **⌘ Command + Space** (this opens Spotlight search).
- Type **Terminal** and press **Return**.
- A white or black window with text appears. That's the Terminal. You type commands here and press **Return** to run them.

### 2. Install Claude Code
- Go to **https://claude.com/claude-code** in your browser and follow their install instructions for Mac, **or** paste this into Terminal and press Return:
  ```
  npm install -g @anthropic-ai/claude-code
  ```
  - If it says "command not found: npm", you first need Node.js — download it from **https://nodejs.org** (pick the "LTS" button), install it, then close and reopen Terminal and try the line above again.

### 3. Sign in to Claude Code
- In Terminal, type:
  ```
  claude
  ```
- It will open a sign-in flow in your browser. Log in with your Claude account. Once it says you're connected, you can close it (press **Control + C**).

✅ **You now have Claude Code installed and signed in.** On to the wizard.

---

## Part 2 — Run the setup wizard

### 1. Unzip the folder
- Double-click `claude-onboard.zip` (it's probably in your Downloads). A folder called `claude-onboard` appears.

### 2. Open Terminal in that folder (easy drag trick)
- Open Terminal again (⌘ Space → "Terminal").
- Type `cd ` — that's **c**, **d**, then a **space**. Don't press Return yet.
- **Drag the `claude-onboard` folder** from Finder right into the Terminal window and let go. It pastes the folder's location automatically.
- Now press **Return**.

### 3. Run these two lines (one at a time, press Return after each)
```
npm install
```
Wait for it to finish (a minute or so — it downloads what it needs). Then:
```
node bin/cli.js
```

### 4. Answer the questions
The wizard now walks you through everything below. Use **arrow keys** to move, **Space** to tick/untick checkboxes, and **Return** to confirm.

If anything ever goes wrong, it asks **Retry / Skip / Stop** — nothing breaks. Just pick one (or text Nick what it said).

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
| **create-viral-content** | *(Currently disabled — its source isn't available yet. Will be added later.)* |

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

### ⏰ Step 7 — Optional daily automation
If you want, it sets up a once-a-day scheduled Claude task. Totally optional — skip it if unsure.

### ✅ Step 8 — Summary
A clean ✓ / ✗ checklist showing exactly what got set up, with proof for each item.

---

## Is it safe?
Yes:
- It **backs up** any existing file before changing it.
- It **never overwrites** your notes.
- It's **safe to re-run** — it skips anything already done.
- If a step fails, you get **Retry / Skip / Stop**, never a crash that breaks things.

## Requirements recap
- A **Mac** (these instructions) — it also works on Windows/Linux.
- **Claude Code** installed and signed in (Part 1).
- **Node.js 18+** (comes with Claude Code).

## If you get stuck
Text Nick exactly what the Terminal says (a screenshot is perfect). The wizard is designed to fail safely, so you can't really break anything.

---

### For the technically curious
Built as a Node.js CLI, fully test-driven (63 automated tests + an end-to-end test). Run `npm test` to see them. The real `claude` CLI calls were validated read-only via `npm run smoke`. A couple of pre-1.0 notes: the `create-viral-content` plugin is disabled pending its source, and the `ffmpeg`-for-video dependency is auto-installed only if you pick the video plugin.
