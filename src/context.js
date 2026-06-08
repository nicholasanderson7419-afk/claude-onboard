import { detectOS, detectPkgManager } from './lib/detect.js';

export async function buildContext({ platform, home, stamp, today, run, io, express = false }) {
  const os = detectOS(platform);
  const pkgManager = await detectPkgManager(os, run);
  return { env: { os, pkgManager, home, stamp, today, run, io, express }, answers: {}, results: {} };
}
