// INGLY OS V2 — test Regole prezzo/imposta riutilizzabili. Preset KB built-in,
// applicazione in blocco al documento, snapshot da doc, CRUD, migration 0042.
import { describe, it, assert, assertEq } from './harness.mjs';
import { readFileSync } from 'node:fs';
import * as PR from '../app-v2/src/pricingrules.js';
import * as Q from '../app-v2/src/quoter.js';

function makeMock(store) {
  let uid = 0;
  function builder(table) {
    const st = { table, filters: [], op: 'select', payload: null, lim: null };
    const api = { select() { return api; }, is(c, v) { st.filters.push((r) => r[c] === v || (v === null && r[c] == null)); return api; }, eq(c, v) { st.filters.push((r) => String(r[c]) === String(v)); return api; }, order() { return api; }, limit(n) { st.lim = n; return api; }, insert(row) { st.op = 'insert'; st.payload = row; return api; }, update(row) { st.op = 'update'; st.payload = row; return api; }, single() { return Promise.resolve(run(st, 'single')); }, then(res, rej) { return Promise.resolve(run(st, 'many')).then(res, rej); } };
    return api;
  }
  function run(st, mode) {
    const arr = store[st.table] || (store[st.table] = []);
    if (st.op === 'insert') { const row = { id: 'id' + (++uid), deleted_at: null, created_at: new Date().toISOString(), ...st.payload }; arr.push(row); return { data: row, error: null }; }
    if (st.op === 'update') { const rows = arr.filter((r) => st.filters.every((f) => f(r))); rows.forEach((r) => Object.assign(r, st.payload)); return { data: rows[0] || null, error: null }; }
    let rows = arr.filter((r) => st.filters.every((f) => f(r))); if (st.lim) rows = rows.slice(0, st.lim);
    if (mode === 'single') return { data: rows[0] || null, error: rows[0] ? null : { message: 'no' } };
    return { data: rows, error: null };
  }
  return { from: (t) => builder(t) };
}

const docBase = () => ({ channel: 'CUSTOM', express: false, global_discount_pct: 0, apply_qty_tiers: false, deposit_pct: 0, terms: '', lines: [{ description: 'A', markup_pct: 100, vat_rate: 22, discount_pct: 0, workings: [{ category: 'material', mq: 1, cost_per_mq: 10 }] }, { description: 'B', markup_pct: 100, vat_rate: 22, discount_pct: 0, workings: [{ category: 'material', mq: 1, cost_per_mq: 20 }] }] });

describe('Regole prezzo/imposta — preset KB built-in', (s) => {
  it(s, 'DEFAULT_RULES include B2C/B2B/Etsy/reverse charge/export con valori KB', () => {
    const byId = Object.fromEntries(PR.DEFAULT_RULES.map((r) => [r.id, r]));
    assertEq(byId['kb:b2c'].markup_pct, 200); assertEq(byId['kb:b2c'].vat_rate, 22);
    assertEq(byId['kb:b2b'].markup_pct, 150);
    assertEq(byId['kb:etsy'].markup_pct, 250);
    assertEq(byId['kb:revchg'].vat_rate, 0); assert(/art\. 17/.test(byId['kb:revchg'].terms), 'nota reverse charge');
    assertEq(byId['kb:export'].vat_rate, 0); assert(/art\. 8/.test(byId['kb:export'].terms), 'nota export');
  });
  it(s, 'normalizeRule segna builtin i preset kb:', () => {
    assert(PR.normalizeRule({ id: 'kb:b2c' }).builtin, 'kb: è builtin');
    assert(!PR.normalizeRule({ id: 'uuid-123' }).builtin, 'db non builtin');
  });
});

describe('Regole prezzo/imposta — applicazione al documento', (s) => {
  it(s, 'applyRule imposta canale/acconto e markup+IVA su OGNI riga', () => {
    const out = PR.applyRule(docBase(), { id: 'kb:b2c', channel: 'B2C', markup_pct: 200, vat_rate: 22, deposit_pct: 50 });
    assertEq(out.channel, 'B2C'); assertEq(out.deposit_pct, 50);
    assert(out.lines.every((l) => l.markup_pct === 200 && l.vat_rate === 22), 'tutte le righe');
  });
  it(s, 'reverse charge: IVA 0 su tutte le righe + termini impostati', () => {
    const rule = PR.DEFAULT_RULES.find((r) => r.id === 'kb:revchg');
    const out = PR.applyRule(docBase(), rule);
    assert(out.lines.every((l) => l.vat_rate === 0), 'IVA 0');
    assert(/inversione contabile/i.test(out.terms), 'termini');
    // effetto reale nel motore: IVA documento = 0
    const d = Q.computeDocument(out.lines, {});
    assertEq(d.iva, 0);
  });
  it(s, 'valori null non toccano i campi (merge chirurgico)', () => {
    const doc = docBase(); doc.express = true; doc.terms = 'mio testo';
    const out = PR.applyRule(doc, { id: 'uuid', vat_rate: 10 });
    assertEq(out.express, true); assertEq(out.terms, 'mio testo'); // invariati
    assert(out.lines.every((l) => l.vat_rate === 10 && l.markup_pct === 100), 'solo IVA cambia');
  });
  it(s, 'immutabile: non muta il doc originale', () => {
    const doc = docBase();
    PR.applyRule(doc, { id: 'x', markup_pct: 300 });
    assertEq(doc.lines[0].markup_pct, 100);
  });
});

describe('Regole prezzo/imposta — snapshot & CRUD', (s) => {
  it(s, 'docToRule cattura la config corrente dalla prima riga', () => {
    const doc = docBase(); doc.channel = 'B2B'; doc.lines[0].markup_pct = 150; doc.lines[0].vat_rate = 0; doc.deposit_pct = 50;
    const r = PR.docToRule(doc, '  Regola Export ', 'Non imponibile');
    assertEq(r.name, 'Regola Export'); assertEq(r.regime, 'Non imponibile');
    assertEq(r.channel, 'B2B'); assertEq(r.markup_pct, 150); assertEq(r.vat_rate, 0); assertEq(r.deposit_pct, 50);
  });
  it(s, 'listRules unisce built-in + salvate; saveRule persiste', async () => {
    const store = {}; const sb = makeMock(store);
    const before = await PR.listRules(sb, {});
    assertEq(before.length, PR.DEFAULT_RULES.length); // backend vuoto → solo KB
    await PR.saveRule(sb, 't1', { name: 'Mia regola', channel: 'B2B', markup_pct: 150, vat_rate: 22 });
    const after = await PR.listRules(sb, {});
    assertEq(after.length, PR.DEFAULT_RULES.length + 1);
    assert(after.some((r) => r.name === 'Mia regola' && !r.builtin), 'regola salvata presente');
  });
  it(s, 'saveRule richiede nome; softDeleteRule rifiuta i preset KB', async () => {
    const store = {}; const sb = makeMock(store);
    let threw = false; try { await PR.saveRule(sb, 't1', { name: '  ' }); } catch (_) { threw = true; }
    assert(threw, 'nome obbligatorio');
    let threw2 = false; try { await PR.softDeleteRule(sb, 'kb:b2c'); } catch (_) { threw2 = true; }
    assert(threw2, 'KB non eliminabile');
  });
});

describe('Regole prezzo/imposta — migration 0042 (statica)', (s) => {
  it(s, 'tabella pricing_rule + RLS + trigger + rollback', () => {
    const sql = readFileSync(new URL('../supabase/migrations/20260101000042_pricing_rule.sql', import.meta.url), 'utf8');
    assert(/create table if not exists public\.pricing_rule\b/.test(sql), 'tabella');
    assert(/has_permission\(tenant_id,'sales\.pricing_rule','read'\)/.test(sql), 'RLS');
    assert(/crm_enforce_delete_perm\('sales\.pricing_rule'\)/.test(sql), 'trigger');
    const down = readFileSync(new URL('../supabase/rollback/20260101000042_pricing_rule_down.sql', import.meta.url), 'utf8');
    assert(/drop table if exists public\.pricing_rule/.test(down), 'rollback drop');
  });
});
