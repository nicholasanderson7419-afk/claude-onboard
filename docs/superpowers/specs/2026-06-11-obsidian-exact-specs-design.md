# Design: Exact-Spec Obsidian Setup + Professional Vault Hierarchy

Date: 2026-06-11
Status: approved (Nick: "Brainstorm it, lay the plan out, and then implement it. Go, dont stop")

## Goal

The product flow, end to end: create project folder on Desktop → install Claude Code
optimally → interview user (goal question) → install plugins/MCPs/skills → install
Obsidian + full configuration → professional vault file hierarchy. Reference spec =
Nick's live machine (`Desktop\Projects\.obsidian`).

## Confirmed failures fixed in this change

1. **Windows installer death (root cause, empirically confirmed 2026-06-11):**
   `$ErrorActionPreference='Stop'` + `2>$null` on a native command that writes to
   stderr converts the stderr line into a *terminating* error in PowerShell 5.1.
   winget writes progress/warnings to stderr → install.ps1 died at the first winget
   call (line 18) → no Obsidian, wizard never ran, zero plugins. Test proof:
   `$ErrorActionPreference='Stop'; cmd /c "echo w 1>&2" 2>$null` → DIED.
   Fix: EAP `Continue`, never redirect native stderr, per-step exit-code reporting.

2. **Silent plugin skip in guided mode** — fixed in 6b2c402 (visible warn + marketplace
   return checked).

## Gap analysis: bundled assets/obsidian vs Nick's live .obsidian

| Item | Live (spec) | Bundled before | Action |
|---|---|---|---|
| community plugins | dataview, smart-connections, mindmap-nextgen, templater, local-llm-helper | identical | none |
| plugin code | main.js/manifest/styles per plugin | identical (smart-connections data.json excluded — personal embeddings) | none |
| appearance | `neural-glow` snippet enabled | 5 generic theme snippets, no neural-glow | **bundle neural-glow.css; add 'Neural Glow' theme option; make it DEFAULT** |
| core-plugins.json | full explicit map (sync:true) | partial subset | **align to live; sync:false (buyer has no Obsidian Sync sub)** |
| graph.json | tuned physics (linkDistance 250, repel 10, textFade 0, no arrows) | not bundled | **bundle cleaned copy (scale reset to 1, colorGroups [])** |
| app.json | ignore filters incl. personal project folders | generic subset | keep generic (personal folders must not ship) |
| workspace.json | per-machine state | not bundled | correctly excluded |

## Vault hierarchy (senior-architect layout)

om-* command suite (17 commands shipped) references `brain/Key Decisions.md`,
`brain/Gotchas.md`, `brain/Patterns.md`, `brain/Memories.md`, `brain/Skills.md`,
`brain/North Star.md`, `Home.md`. Previous scaffold created bare dirs only —
commands broke on fresh installs. New scaffold:

```
vault/
  Home.md                  hub note — entry point, links all sections
  MEMORY.md                (existing) cross-session memory index
  brain/                   operating system of the second brain
    Key Decisions.md       append-only decision log
    Gotchas.md             append-only mistake log
    Patterns.md            append-only pattern log
    Memories.md            durable long-term notes
    Skills.md              skills/tools inventory
    (North Star.md         seeded by the North Star interview step — not here)
  projects/                one folder per project
    _Project Template.md
  wiki/concepts/           evergreen concept notes
  raw/                     inbox — capture first, file later
  Templates/               Obsidian templates (core Templates plugin points here)
    Daily Note.md
    Meeting Note.md
  archive/                 completed/dead projects move here
```

All seed notes carry the standard frontmatter (`date/type/tags`) and wikilink to
[[Home]] so the graph is connected from minute one.

## Components changed

- `install.ps1` — full rewrite per failure #1; installs Claude desktop app, Obsidian,
  Claude Code CLI, Node LTS, Git via winget with visible per-item results; PATH
  refresh; auth gate; clone; wizard; post-verify (plugin list + exit code).
- `src/data/themes.js` — add `neural` theme (snippet `neural-glow`), DEFAULT_THEME =
  `neural`.
- `assets/obsidian/snippets/neural-glow.css` — exact copy of live snippet (473 lines).
- `assets/obsidian/core-plugins.json` — aligned to live spec, `sync: false`.
- `assets/obsidian/graph.json` — live physics, neutral scale, empty colorGroups.
- `src/steps/06-secondbrain.js` — scaffoldTree extended to the hierarchy above with
  seeded starter notes (idempotent — existing files never overwritten).

## Error handling

scaffoldTree only writes missing files (re-run safe). copyTree skips existing
`.obsidian` (no clobbering a user's tuned vault). install.ps1 reports each failure
inline and keeps going where safe; hard-stops only on claude/node/git absent.

## Testing

- Unit: themes (neural present/default), secondbrain scaffold list.
- Suite must stay green (119 tests).
- Live: full VPS clean-room run with real credentials → verify plugin list, vault
  tree, .obsidian contents.
