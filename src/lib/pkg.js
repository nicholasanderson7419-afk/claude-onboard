const INSTALL = {
  winget: (pkg) => ['winget', ['install', '-e', '--id', pkg, '--silent']],
  brew:   (pkg) => ['brew', ['install', pkg]],
  apt:    (pkg) => ['sudo', ['apt-get', 'install', '-y', pkg]]
};
const WINGET_ID = { git: 'Git.Git', gh: 'GitHub.cli', ffmpeg: 'Gyan.FFmpeg' };

export async function hasBinary(run, bin) { return (await run(bin, ['--version'])).ok; }

// Installs bin if missing. Returns {ok, change, error?}.
export async function installBinary(env, bin) {
  if (await hasBinary(env.run, bin)) return { ok: true, change: `${bin}: already present` };
  if (!env.pkgManager) return { ok: false, error: `No package manager for ${env.os}; install ${bin} manually.` };
  const pkg = env.pkgManager === 'winget' ? (WINGET_ID[bin] || bin) : bin;
  const [cmd, args] = INSTALL[env.pkgManager](pkg);
  const r = await env.run(cmd, args);
  if (!r.ok) return { ok: false, error: `install ${bin} failed: ${r.stderr}` };
  return { ok: true, change: `installed: ${bin}` };
}
