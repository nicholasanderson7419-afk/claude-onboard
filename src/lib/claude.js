export const addMarketplace = (run, source) =>
  run('claude', ['plugin', 'marketplace', 'add', source]);

export const installPlugin = (run, name, marketplace) =>
  run('claude', ['plugin', 'install', `${name}@${marketplace}`, '-s', 'user']);

export const addMcp = (run, name, scope, commandParts, env = {}) => {
  const envFlags = Object.entries(env).flatMap(([k, v]) => ['-e', `${k}=${v}`]);
  return run('claude', ['mcp', 'add', name, '-s', scope, ...envFlags, '--', ...commandParts]);
};

export const pluginList = (run) => run('claude', ['plugin', 'list']);
export const mcpList = (run) => run('claude', ['mcp', 'list']);
export const claudeOnPath = (run) => run('claude', ['--version']);
