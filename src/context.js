import { detectOS, detectPkgManager } from './lib/detect.js';

export async function buildContext({ platform, home, stamp, today, run, io, express = false, guided = false, projectRoot = null }) {
  const os = detectOS(platform);
  const pkgManager = await detectPkgManager(os, run);
  return { env: { os, pkgManager, home, stamp, today, run, io, express, guided, projectRoot }, answers: {}, results: {} };
}
