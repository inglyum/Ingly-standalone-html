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
          const pr = g.pricing || {};
          const priced = pr.computePrice ? pr.computePrice({ material: 2, machine: 1, laborHours: 0.5, channel: 'b2c' }) : null;
          const minKey = pr.computePrice ? pr.computePrice({ material: 0.1, laborHours: 0.02, channel: 'b2c', category: 'portachiavi' }) : null;
          return {
            pricePriced: priced ? priced.price : null,
            priceMinApplied: minKey ? minKey.price : null,
            qty10: pr.qtyDiscount ? pr.qtyDiscount(10) : null,
            qty50: pr.qtyDiscount ? pr.qtyDiscount(50) : null,
            quote: (g.quote && g.quote.computeQuote) ? g.quote.computeQuote([{ label: 'PC', material: 2, machine: 1, laborHours: 0.5, qty: 10, custom: true }], 'b2c') : null,
            canon: g.orders ? g.orders.canonicalStatus('paid') : null,
            trOk: g.orders ? g.orders.canTransition('preventivo', 'inviato') : null,
            trNo: g.orders ? g.orders.canTransition('venduto', 'preventivo') : null,
            kpi: g.orders ? g.orders.computeKpi([{ status: 'venduto', total: 200 }, { status: 'venduto', total: 200 }, { status: 'preventivo' }]) : null,
            DS: !!window.DS,
            audit: !!(window.AuditLog && window.AuditLog.__v67),
            mi: !!(window.MachineInvest && window.MachineInvest.__v65),
            payback: window.MachineInvest ? window.MachineInvest.metrics({ costBuy: 5000, roiMonthly: 800 }).payback : null,
            intel: !!(window.ERPIntel && window.ERPIntel.__v66),
            actionsN: window.ERPIntel ? window.ERPIntel.actions({ onTrack: false, weekRev: 100, target: 375, pending: 2, quotesTot: 300, low: [], notPaid: [] }).length : 0,
            mh: !!(window.MarketHub && window.MarketHub.__v69),
            dirCats: window.MarketHub ? Object.keys(window.MarketHub.DIR).length : 0,
            dt: !!(window.DataTools && window.DataTools.__v64),
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
        assert(r.intel, 'window.ERPIntel non installato dal bundle');
        assert(r.actionsN >= 2, 'ERPIntel.actions dovrebbe produrre azioni (sotto target + pending)');
        assert(r.mh, 'window.MarketHub non installato dal bundle');
        assert(r.dirCats >= 5, 'MarketHub.DIR dovrebbe avere ≥5 categorie fornitori');
        assert(r.dt, 'window.DataTools non installato dal bundle');
        // pricing KB: (2*1.15 + 1 + 0.5*18) * 3 = 12.3*3 = 36.9 → 36.90
        assertEq(r.pricePriced, 36.9, 'pricing.computePrice errato (atteso 36.90)');
        assertEq(r.priceMinApplied, 6.90, 'minimo psicologico portachiavi non applicato (atteso 6.90)');
        assertEq(r.qty10, 0.10, 'sconto quantità 10+ errato');
        assertEq(r.qty50, 0.20, 'sconto quantità 50+ errato');
        // preventivo: 10× a 36.90 con −10% = to90(332.1)=332.9; acconto 50% (custom>50)
        assert(r.quote, 'quote.computeQuote non disponibile dal bundle');
        assertEq(r.quote.lines[0].lineTotal, 332.9, 'lineTotal preventivo errato');
        assertEq(r.quote.subtotal, 332.9, 'subtotale preventivo errato');
        assertEq(r.quote.deposit, 166.9, 'acconto 50% errato');
        assert(r.quote.meetsOrderMinimum === true, 'minimo ordine dovrebbe essere soddisfatto');
        // ordini: modello di stato + KPI
        assertEq(r.canon, 'venduto', "canonicalStatus('paid') dovrebbe essere 'venduto'");
        assert(r.trOk === true, 'transizione preventivo→inviato ammessa');
        assert(r.trNo === false, 'transizione venduto→preventivo NON ammessa');
        assertEq(r.kpi.won, 2, 'KPI won errato');
        assertEq(r.kpi.revenue, 400, 'KPI revenue errato');
        assert(r.kpi.meetsRevenue === true, 'KPI meetsRevenue (400≥375) errato');
        assertEq(r.icon, 'svg', 'icona non è un <svg>');
        assertEq(r.eur, '€1.234', 'eur() errato');
        assertEq(r.to90, 24.9, 'to90() errato');
        assertEq(r.pct, 25, 'pct() errato');
      }, { wait: 500 });
    } finally { rmSync(html, { force: true }); }
  });
});
