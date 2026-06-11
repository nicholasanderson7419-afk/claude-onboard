export function detectOS(platform = process.platform) {
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'mac';
  return 'linux';
}

// runner(cmd,args) → {ok}. Probe with the OS "is this on PATH" command.
export async function detectPkgManager(os, runner) {
  const probe = async (bin) => {
    if (os === 'windows') return (await runner('where', [bin])).ok;
    return (await runner('which', [bin])).ok;
  };
  if (os === 'windows' && await probe('winget')) return 'winget';
  if (os === 'mac' && await probe('brew')) return 'brew';
  if (os === 'linux' && await probe('apt-get')) return 'apt';
  return null;
}

export function parsePluginList(stdout) {
  const out = [];
  const lines = stdout.split(/\r?\n/);
  let cur = null;
  for (const line of lines) {
    const head = line.match(/^\s*[^\sA-Za-z0-9]?\s*([A-Za-z0-9._-]+)@(\S+)\s*$/);
    if (head) { cur = { name: head[1], marketplace: head[2], enabled: false }; out.push(cur); continue; }
    if (cur && /Status:/.test(line)) cur.enabled = /enabled/i.test(line) && !/disabled/i.test(line);
  }
  return out;
}

export function parseMcpList(stdout) {
  // claude mcp list marks status with ✓/✔ (connected) or ✗/✘ (failed) depending on version/platform.
  const out = [];
  for (const line of stdout.split(/\r?\n/)) {
    const m = line.match(/^([\w:-]+):\s.*-\s*([✓✔]\s*Connected|[✗✘].*)$/u);
    if (m) out.push({ name: m[1], connected: /^[✓✔]/u.test(m[2]) });
  }
  return out;
}
