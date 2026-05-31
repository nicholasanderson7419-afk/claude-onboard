import { existsSync, copyFileSync, constants, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

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

export function mergeHooks(settings, newHooks) {
  const out = { ...settings, hooks: { ...(settings.hooks || {}) } };
  for (const [event, entries] of Object.entries(newHooks)) {
    const current = out.hooks[event] ? [...out.hooks[event]] : [];
    const existingCmds = new Set(
      current.flatMap(e => (e.hooks || []).map(h => h.command))
    );
    for (const entry of entries) {
      const cmds = (entry.hooks || []).map(h => h.command);
      const allPresent = cmds.length > 0 && cmds.every(c => existingCmds.has(c));
      if (!allPresent) {
        current.push(entry);
        cmds.forEach(c => existingCmds.add(c));
      }
    }
    out.hooks[event] = current;
  }
  return out;
}

export function scaffoldTree(root, tree) {
  const created = [];
  for (const [rel, body] of Object.entries(tree)) {
    const target = join(root, rel);
    if (rel.endsWith('/') || body === null) {
      mkdirSync(target, { recursive: true });
      continue;
    }
    if (!existsSync(target)) {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, body);
      created.push(rel);
    }
  }
  return created;
}
