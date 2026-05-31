import { existsSync, copyFileSync, constants } from 'node:fs';

export function backupFile(path, stamp) {
  if (!existsSync(path)) return null;
  const bak = `${path}.bak.${stamp}`;
  if (existsSync(bak)) return bak;               // never clobber a prior backup
  copyFileSync(path, bak, constants.COPYFILE_EXCL);
  return bak;
}
