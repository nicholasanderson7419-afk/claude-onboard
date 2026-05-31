import { existsSync, copyFileSync, constants, mkdirSync, writeFileSync } from 'node:fs';

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
  function walk(dir, node) {
    mkdirSync(dir, { recursive: true });
    for (const [key, val] of Object.entries(node)) {
      const path = `${dir}/${key}`;
      if (val === null || typeof val !== 'object' || val instanceof Date) {
        if (!existsSync(path)) writeFileSync(path, val || '');
      } else if (Object.keys(val).length === 0) {
        mkdirSync(path, { recursive: true });
      } else {
        walk(path, val);
      }
    }
  }
  walk(root, tree);
}
