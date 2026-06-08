// Obsidian color "vibe" picker. Each theme = a base mode (dark=obsidian / light=moonstone)
// + a bundled CSS snippet that sets the accent via Obsidian's --accent-h/s/l variables.
export const THEMES = [
  { value: 'clay',    label: 'Warm Clay (dark)',       mode: 'obsidian',  snippet: 'claude-clay' },
  { value: 'purple',  label: 'Midnight Purple (dark)', mode: 'obsidian',  snippet: 'midnight-purple' },
  { value: 'emerald', label: 'Emerald (dark)',         mode: 'obsidian',  snippet: 'emerald' },
  { value: 'ocean',   label: 'Ocean (dark)',           mode: 'obsidian',  snippet: 'ocean' },
  { value: 'light',   label: 'Clean Light',            mode: 'moonstone', snippet: 'clean-light' },
];

export const DEFAULT_THEME = 'clay';

// -> the appearance.json the wizard writes for the chosen vibe.
export function appearanceFor(value) {
  const t = THEMES.find(x => x.value === value) || THEMES.find(x => x.value === DEFAULT_THEME);
  return { theme: t.mode, enabledCssSnippets: [t.snippet] };
}
