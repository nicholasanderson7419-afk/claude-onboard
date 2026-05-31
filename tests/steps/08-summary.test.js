import { describe, it, expect } from 'vitest';
import { renderSummary } from '../../src/steps/08-summary.js';

describe('renderSummary', () => {
  it('renders green/red lines with proof', () => {
    const results = {
      plugins: { checks: [{ name: 'plugin superpowers', pass: true, proof: 'installed' }] },
      hooks: { checks: [{ name: 'SessionStart hook', pass: false, proof: 'missing' }] }
    };
    const out = renderSummary(results);
    expect(out).toMatch(/✓.*superpowers.*installed/);
    expect(out).toMatch(/✗.*SessionStart.*missing/);
  });

  it('reports overall fail when any check failed', () => {
    const results = { x: { checks: [{ name: 'a', pass: false, proof: 'p' }] } };
    expect(renderSummary(results)).toMatch(/some steps need attention/i);
  });
});
