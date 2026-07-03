// Extra skills + slash-commands the wizard can install, by source type.
//
// CLONE_SKILLS    — have a real upstream repo -> git clone into ~/.claude/skills/<name>
// BUNDLED_SKILLS  — local-only skills shipped in assets/skills/<name> -> copied to ~/.claude/skills/<name>
// BUNDLED_COMMANDS — shipped in assets/commands/<file> -> copied to <projectDir>/.claude/commands/<file>
//   (om-standup is created by the North Star step, so it is NOT bundled here.)
//
// NOTE (2026-06-08): the 7 trading skills (ito-*, prediction-market-*,
// llm-trading-agent-security) were removed from the sold product — Nick's
// personal trading edge, not for a general $39 audience. BUNDLED_SKILLS is now
// empty; the loop in step 06e is kept so future general-purpose bundled skills
// can be added without code changes.

export const CLONE_SKILLS = [
  {
    name: 'llm-council',
    repo: 'https://github.com/tenfoldmarc/llm-council-skill',
    desc: '5-advisor council: independent analysis, anonymous peer-review, chairman synthesis.'
  }
];

// real-estate: residential+commercial agent workflows + unit-tested calc helpers.
// email-assistant: Gmail triage/summarize/draft via the first-party claude.ai
// Gmail connector (drafts only — the connector exposes no send tool).
// Both implied by the 'realestate' goal; installed by default outside guided mode.
export const BUNDLED_SKILLS = ['real-estate', 'email-assistant'];

export const BUNDLED_COMMANDS = [
  'om-capture-1on1.md', 'om-dump.md', 'om-humanize.md', 'om-incident-capture.md',
  'om-intake.md', 'om-meeting.md', 'om-peer-scan.md', 'om-prep-1on1.md',
  'om-project-archive.md', 'om-review-brief.md', 'om-review-peer.md', 'om-self-review.md',
  'om-slack-scan.md', 'om-vault-audit.md', 'om-vault-upgrade.md', 'om-weekly.md', 'om-wrap-up.md'
];
