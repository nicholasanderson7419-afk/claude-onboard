import { existsSync, copyFileSync, constants } from 'node:fs';

export function backupFile(path, stamp) {
  if (!existsSync(path)) return null;
  const bak = `${path}.bak.${stamp}`;
  if (existsSync(bak)) return bak;               // never clobber a prior backup
  copyFileSync(path, bak, constants.COPYFILE_EXCL);
  return bak;
}

export function appendSection(content, marker, body) {
  const start = `<!-- ${marker}:start -->`;
  const end = `<!-- ${marker}:end -->`;
  const block = `${start}\n${body}\n${end}`;
  const re = new RegExp(`${escapeRe(start)}[\\s\\S]*?${escapeRe(end)}`);
  if (re.test(content)) return content.replace(re, block);
  const sep = content.endsWith('\n') ? '\n' : '\n\n';
  return content + sep + block + '\n';
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
