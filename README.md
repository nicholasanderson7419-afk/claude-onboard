# claude-onboard

Guided setup wizard for Claude Code — for people new to it.

## Run

```
npx claude-onboard
```

## What it does

Checks Claude Code is installed + logged in, installs prerequisites you need,
sets up proven plugins, writes your CLAUDE.md, adds a useful hook, wires an
Obsidian-style second brain, and builds your **North Star** (a living goals file
Claude reads every session). Every step is verified and shown with proof.

## Requirements

- Claude Code installed and logged in
- Node 18+ (you already have it if Claude Code runs)

## Open items (pre-1.0)

- `aaaronmiller` marketplace source unknown → create-viral-content disabled
- ffmpeg requirement for claude-video-vision to be confirmed
- Run `npm run smoke` on a real machine to validate headless installs
