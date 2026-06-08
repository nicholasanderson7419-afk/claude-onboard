export const MARKETPLACES = {
  'superpowers-marketplace': 'obra/superpowers-marketplace',
  'caveman': 'JuliusBrussee/caveman',
  'trailofbits': 'trailofbits/skills',
  'claude-plugins-official': 'anthropics/claude-plugins-official',
  'claude-video-vision': 'https://github.com/jordanrendric/claude-video-vision.git',
  'obsidian-skills': 'kepano/obsidian-skills'
};

export const CORE = [
  { name: 'superpowers', marketplace: 'superpowers-marketplace' },
  { name: 'caveman', marketplace: 'caveman' },
  { name: 'claude-session-driver', marketplace: 'superpowers-marketplace' },
  { name: 'double-shot-latte', marketplace: 'superpowers-marketplace' },
  { name: 'ask-questions-if-underspecified', marketplace: 'trailofbits' },
  { name: 'debug-buttercup', marketplace: 'trailofbits' }
];

export const OPTIONAL = [
  { name: 'elements-of-style', marketplace: 'superpowers-marketplace', available: true },
  { name: 'private-journal-mcp', marketplace: 'superpowers-marketplace', available: true },
  { name: 'agentic-actions-auditor', marketplace: 'trailofbits', available: true },
  { name: 'differential-review', marketplace: 'trailofbits', available: true },
  { name: 'gh-cli', marketplace: 'trailofbits', available: true, needs: ['gh'] },
  { name: 'code-review', marketplace: 'claude-plugins-official', available: true, needs: ['gh'] },
  { name: 'claude-video-vision', marketplace: 'claude-video-vision', available: true, needs: ['ffmpeg'] },
  { name: 'obsidian', marketplace: 'obsidian-skills', available: true }
];
