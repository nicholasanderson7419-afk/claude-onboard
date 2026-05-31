import * as p from '@clack/prompts';
function unwrap(v) { return p.isCancel(v) ? null : v; }
export function clackIo() {
  return {
    text: async (o) => unwrap(await p.text(o)),
    confirm: async (o) => unwrap(await p.confirm(o)),
    select: async (o) => unwrap(await p.select(o)),
    multiselect: async (o) => unwrap(await p.multiselect(o)),
  };
}
