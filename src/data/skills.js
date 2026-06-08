// Extra skills + slash-commands the wizard can install, by source type.
//
// CLONE_SKILLS  — have a real upstream repo → git clone into ~/.claude/skills/<name>
// BUNDLED_SKILLS — no upstream (Nick's custom); shipped in assets/skills/<name> → copied to ~/.claude/skills/<name>
// BUNDLED_COMMANDS — shipped in assets/commands/<file> → copied to <projectDir>/.claude/commands/<file>
//   (om-standup is created by the North Star step, so it is NOT bundled here.)

export const CLONE_SKILLS = [
  {
    name: 'llm-council',
    repo: 'https://github.com/tenfoldmarc/llm-council-skill',
    desc: '5-advisor council: independent analysis, anonymous peer-review, chairman synthesis.'
  }
];

export const BUNDLED_SKILLS = [
  'prediction-market-oracle-research',
  'prediction-market-risk-review',
  'ito-trade-planner',
  'ito-market-intelligence',
  'ito-basket-compare',
  'ito-data-atlas-agent',
  'llm-trading-agent-security'
];

export const BUNDLED_COMMANDS = [
  'om-capture-1on1.md', 'om-dump.md', 'om-humanize.md', 'om-incident-capture.md',
  'om-intake.md', 'om-meeting.md', 'om-peer-scan.md', 'om-prep-1on1.md',
  'om-project-archive.md', 'om-review-brief.md', 'om-review-peer.md', 'om-self-review.md',
  'om-slack-scan.md', 'om-vault-audit.md', 'om-vault-upgrade.md', 'om-weekly.md', 'om-wrap-up.md'
];
