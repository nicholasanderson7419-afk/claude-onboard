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
