// INGLY OS V2 — test opzioni prezzo Smart Quoter: express, sconto globale,
// sconti quantità KB, preset canale, allerta margine. Deterministico.
import { describe, it, assert, assertEq } from './harness.mjs';
import { readFileSync } from 'node:fs';
import * as Q from '../app-v2/src/quoter.js';

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const base = { workings: [{ category: 'material', mq: 1, cost_per_mq: 10 }], markup_pct: 100, vat_rate: 22, quantity: 1 };

describe('Quoter — express e sconti (precisi)', (s) => {
  it(s, 'listPrice e unitPrice uguali senza express; express +25% maggiora', async () => {
    const c0 = Q.computeLine(base, {});
    assertEq(c0.unitCost, 10); assertEq(c0.listPrice, Q.roundTo90(20)); assertEq(c0.unitPrice, c0.listPrice);
    const cE = Q.computeLine(base, { expressPct: 25 });
    assertEq(cE.expressPct, 25);
    assertEq(cE.unitPrice, Q.roundTo90(c0.listPrice * 1.25)); // +25% sul listino
    assert(cE.unitPrice > c0.unitPrice, 'express alza il prezzo');
  });
  it(s, 'sconto globale si somma allo sconto riga', async () => {
    const c = Q.computeLine({ ...base, discount_pct: 10 }, { extraDiscountPct: 10 });
    assertEq(c.discountPct, 20); // 10 riga + 10 globale
    assertEq(c.netUnit, r2(c.unitPrice * 0.8));
  });
  it(s, 'sconti quantità KB opt-in: 10+ −10%, 25+ −15%, 50+ −20%', async () => {
    assertEq(Q.computeLine({ ...base, quantity: 10 }, { applyQtyTiers: true }).qtyDiscPct, 10);
    assertEq(Q.computeLine({ ...base, quantity: 25 }, { applyQtyTiers: true }).qtyDiscPct, 15);
    assertEq(Q.computeLine({ ...base, quantity: 50 }, { applyQtyTiers: true }).qtyDiscPct, 20);
    assertEq(Q.computeLine({ ...base, quantity: 50 }, {}).qtyDiscPct, 0); // off di default
  });
  it(s, 'sconto totale capato al 95%', async () => {
    const c = Q.computeLine({ ...base, discount_pct: 90 }, { extraDiscountPct: 50 });
    assertEq(c.discountPct, 95);
  });
});

describe('Quoter — preset canale + allerta margine', (s) => {
  it(s, 'CHANNEL_PRESETS KB coerenti', async () => {
    assertEq(Q.channelPreset('B2C').markupPct, 200); assertEq(Q.channelPreset('B2C').minMarginPct, 65);
    assertEq(Q.channelPreset('B2B').markupPct, 150); assertEq(Q.channelPreset('B2B').minMarginPct, 55);
    assertEq(Q.channelPreset('ETSY').markupPct, 250);
    assertEq(Q.channelPreset('???').label, Q.CHANNEL_PRESETS.CUSTOM.label); // fallback
  });
  it(s, 'computeDocument segnala righe sotto la soglia di margine del canale', async () => {
    // markup 10% → margine ~9%, ben sotto 65% (B2C)
    const d = Q.computeDocument([{ workings: [{ category: 'material', mq: 1, cost_per_mq: 10 }], markup_pct: 10, vat_rate: 22, quantity: 1, description: 'Targa' }], { minMarginPct: 65 });
    assertEq(d.minMarginPct, 65);
    assert(!d.marginOk, 'documento sotto soglia');
    assert(d.belowMin.length === 1 && d.belowMin[0].description === 'Targa', 'riga segnalata');
  });
  it(s, 'documento in regola: belowMin vuoto, marginOk true', async () => {
    const d = Q.computeDocument([{ ...base, description: 'OK' }], { minMarginPct: 40 }); // markup 100 → margine ~50%
    assert(d.marginOk && d.belowMin.length === 0, 'in regola');
  });
});

describe('Quoter — migration 0038 (statica)', (s) => {
  it(s, 'colonne opzioni prezzo additive, nessuna tabella nuova', async () => {
    const sql = readFileSync(new URL('../supabase/migrations/20260101000038_quote_pricing_options.sql', import.meta.url), 'utf8');
    assert(/add column if not exists channel text/.test(sql), 'channel');
    assert(/add column if not exists express boolean/.test(sql), 'express');
    assert(/add column if not exists global_discount_pct numeric/.test(sql), 'sconto globale');
    assert(/add column if not exists apply_qty_tiers boolean/.test(sql), 'sconti qtà');
    assert(!/create table/.test(sql), 'nessuna tabella nuova');
  });
});
