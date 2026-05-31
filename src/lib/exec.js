import { execFile } from 'node:child_process';

export function run(cmd, args = [], opts = {}) {
  return new Promise((resolve) => {
    execFile(cmd, args, { encoding: 'utf8', ...opts }, (err, stdout, stderr) => {
      if (err && typeof err.code !== 'number') {
        // spawn failure (e.g. ENOENT): no numeric exit code
        resolve({ ok: false, code: null, stdout: stdout || '', stderr: String(err.message || err) });
      } else {
        const code = err ? err.code : 0;
        resolve({ ok: code === 0, code, stdout: stdout || '', stderr: stderr || '' });
      }
    });
  });
}
