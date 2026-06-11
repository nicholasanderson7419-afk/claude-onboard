export const addMarketplace = (run, source) =>
  run('claude', ['plugin', 'marketplace', 'add', source]);

export const installPlugin = (run, name, marketplace) =>
  run('claude', ['plugin', 'install', `${name}@${marketplace}`, '-s', 'user']);

export const addMcp = async (run, name, scope, commandParts, env = {}) => {
  const envFlags = Object.entries(env).flatMap(([k, v]) => ['-e', `${k}=${v}`]);
  const r = await run('claude', ['mcp', 'add', name, '-s', scope, ...envFlags, '--', ...commandParts]);
  // Idempotent: an already-registered server is success, not failure (re-runs must be safe).
  if (!r.ok && /already exists/i.test(`${r.stderr}${r.stdout}`)) return { ...r, ok: true, alreadyExisted: true };
  return r;
};

export const pluginList = (run) => run('claude', ['plugin', 'list']);
export const mcpList = (run) => run('claude', ['mcp', 'list']);
export const claudeOnPath = (run) => run('claude', ['--version']);
