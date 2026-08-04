// Test del bundle modulare (Fase 1): dist/ingly-modules.js deve installare i
// moduli estratti e le utility pure devono dare risultati corretti.
// CI esegue `npm run build` prima dei test, quindi dist/ esiste.
import { describe, it, assert, assertEq, withPage } from './harness.mjs';
import { existsSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist', 'ingly-modules.js');

describe('Bundle modulare (Fase 1)', (s) => {
  it(s, 'dist/ingly-modules.js esiste (build eseguita)', async () => {
    assert(existsSync(dist), 'Bundle mancante — esegui `npm run build`');
  });

  it(s, 'installa DS + InglyIcons e le utility format sono corrette', async () => {
    if (!existsSync(dist)) throw new Error('Bundle mancante — esegui `npm run build`');
    const html = join(process.cwd(), '_bundle_test.html');
    writeFileSync(html, '<!doctype html><html><head><meta charset="utf-8"></head><body><script src="./dist/ingly-modules.js"></script></body></html>');
    try {
      await withPage('file://' + html, async (page) => {
        const r = await page.evaluate(() => {
          const g = window.InglyModules || {};
          const fmt = g.format || {};
          return {
            DS: !!window.DS,
            audit: !!(window.AuditLog && window.AuditLog.__v67),
            mi: !!(window.MachineInvest && window.MachineInvest.__v65),
            payback: window.MachineInvest ? window.MachineInvest.metrics({ costBuy: 5000, roiMonthly: 800 }).payback : null,
            icon: window.InglyIcons ? window.InglyIcons.get('user', 20).tagName.toLowerCase() : null,
            eur: fmt.eur ? fmt.eur(1234) : null,
            to90: fmt.to90 ? fmt.to90(24.2) : null,
            pct: fmt.pct ? fmt.pct(1, 4) : null,
          };
        });
        assert(r.DS, 'window.DS non installato dal bundle');
        assert(r.audit, 'window.AuditLog non installato dal bundle');
        assert(r.mi, 'window.MachineInvest non installato dal bundle');
        assertEq(r.payback, 7, 'metrics.payback errato (5000/800 → 7)');
        assertEq(r.icon, 'svg', 'icona non è un <svg>');
        assertEq(r.eur, '€1.234', 'eur() errato');
        assertEq(r.to90, 24.9, 'to90() errato');
        assertEq(r.pct, 25, 'pct() errato');
      }, { wait: 500 });
    } finally { rmSync(html, { force: true }); }
  });
});
