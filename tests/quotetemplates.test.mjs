// INGLY OS V2 — test Modelli di preventivo: snapshot config riutilizzabile,
// CRUD, migrazione statica. Pattern v96 quote_templates.
import { describe, it, assert, assertEq } from './harness.mjs';
import { readFileSync } from 'node:fs';
import * as TPL from '../app-v2/src/quotetemplates.js';

function makeMock(store) {
  let uid = 0;
  function builder(table) {
    const st = { table, filters: [], op: 'select', payload: null, lim: null };
    const api = { select() { return api; }, is(c, v) { st.filters.push((r) => r[c] === v || (v === null && r[c] == null)); return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, order() { return api; }, limit(n) { st.lim = n; return api; }, insert(row) { st.op = 'insert'; st.payload = row; return api; }, update(row) { st.op = 'update'; st.payload = row; return api; }, single() { return Promise.resolve(run(st, 'single')); }, then(res, rej) { return Promise.resolve(run(st, 'many')).then(res, rej); } };
    return api;
  }
  function run(st, mode) {
    const arr = store[st.table] || (store[st.table] = []);
    if (st.op === 'insert') { const row = { id: 'id' + (++uid), deleted_at: null, ...st.payload }; arr.push(row); return { data: row, error: null }; }
    if (st.op === 'update') { const rows = arr.filter((r) => st.filters.every((f) => f(r))); rows.forEach((r) => Object.assign(r, st.payload)); return { data: rows[0] || null, error: null }; }
    let rows = arr.filter((r) => st.filters.every((f) => f(r))); if (st.lim) rows = rows.slice(0, st.lim);
    if (mode === 'single') return { data: rows[0] || null, error: rows[0] ? null : { message: 'no' } };
    return { data: rows, error: null };
  }
  return { from: (t) => builder(t) };
}

const doc = () => ({
  title: 'Kit matrimonio', customer_id: 'c1', customer_name: 'Rossi', channel: 'B2C', express: true,
  global_discount_pct: 5, apply_qty_tiers: true, deposit_pct: 50,
  lines: [{ description: 'Targa', product_id: 'p1', quantity: 2, markup_pct: 200, discount_pct: 0, vat_rate: 22, workings: [{ category: 'material', mq: 1, cost_per_mq: 10 }] }],
});

describe('Modelli — snapshot config (senza cliente)', (s) => {
  it(s, 'docToTemplate congela righe/opzioni ed esclude il cliente', async () => {
    const t = TPL.docToTemplate(doc());
    assert(!('customer_id' in t) && !('customer_name' in t), 'niente cliente nel modello');
    assertEq(t.channel, 'B2C'); assertEq(t.express, true); assertEq(t.apply_qty_tiers, true);
    assertEq(t.lines.length, 1); assertEq(t.lines[0].markup_pct, 200);
    assert(Array.isArray(t.lines[0].workings) && t.lines[0].workings[0].category === 'material', 'lavorazioni congelate');
  });
  it(s, 'templateToDoc ripristina opzioni e svuota il cliente', async () => {
    const d = TPL.templateToDoc({ doc: TPL.docToTemplate(doc()) });
    assertEq(d.customer_id, ''); assertEq(d.customer_name, '');
    assertEq(d.channel, 'B2C'); assertEq(d.deposit_pct, 50);
    assert(d.lines && d.lines.length === 1, 'righe ripristinate');
  });
});

describe('Modelli — CRUD', (s) => {
  it(s, 'saveTemplate richiede nome; listTemplates ritorna; softDelete esclude', async () => {
    const store = {}; const sb = makeMock(store);
    let threw = false; try { await TPL.saveTemplate(sb, 't1', '  ', doc()); } catch { threw = true; }
    assert(threw, 'nome obbligatorio');
    const t = await TPL.saveTemplate(sb, 't1', 'Matrimonio base', doc(), 'wedding');
    assertEq(t.name, 'Matrimonio base'); assert(!('customer_id' in (t.doc || {})), 'doc senza cliente');
    assertEq((await TPL.listTemplates(sb, {})).length, 1);
    await TPL.softDeleteTemplate(sb, t.id);
    assertEq((await TPL.listTemplates(sb, {})).length, 0);
  });
});

describe('Modelli — migration 0039 (statica)', (s) => {
  it(s, 'tabella quote_template + doc jsonb + RLS + trigger', async () => {
    const sql = readFileSync(new URL('../supabase/migrations/20260101000039_quote_template.sql', import.meta.url), 'utf8');
    assert(/create table if not exists public\.quote_template\b/.test(sql), 'tabella');
    assert(/doc jsonb not null/.test(sql), 'doc jsonb');
    assert(/has_permission\(tenant_id,'sales\.quote_template','read'\)/.test(sql), 'RLS');
    assert(/crm_enforce_delete_perm\('sales\.quote_template'\)/.test(sql), 'trigger');
  });
});
