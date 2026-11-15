// INGLY OS V2 — Regole prezzo/imposta riutilizzabili (data-layer).
// Concetto ERPNext (Pricing Rule + Tax Template) adattato alla KB INGLY: un
// preset riunisce canale, markup, aliquota IVA, sconti e termini e li applica
// in un colpo a tutto il documento Smart Quoter. CRUD reale, RLS/RBAC
// 'sales.pricing_rule'. Dipende da migr. 0042. I PRESET KB sono built-in e
// funzionano anche offline (nessun backend richiesto): sono di sola lettura.
import { friendlyError, canWrite, canDelete } from './crm.js';
export { friendlyError, canWrite, canDelete };

// Preset KB built-in (sempre disponibili, id con prefisso 'kb:'). Riflettono
// ecommerce-rules.md: markup B2C ×3 / B2B ×2.5 / Etsy ×3.5, IVA 22%, regimi
// speciali (reverse charge, non imponibile export).
export const DEFAULT_RULES = [
  { id: 'kb:b2c', name: 'B2C · IVA 22% (×3)', regime: 'IVA 22%', channel: 'B2C', markup_pct: 200, vat_rate: 22, deposit_pct: 50 },
  { id: 'kb:b2b', name: 'B2B · IVA 22% (×2,5)', regime: 'IVA 22%', channel: 'B2B', markup_pct: 150, vat_rate: 22, deposit_pct: 50 },
  { id: 'kb:etsy', name: 'Etsy · IVA 22% (×3,5)', regime: 'IVA 22%', channel: 'ETSY', markup_pct: 250, vat_rate: 22, deposit_pct: 0 },
  { id: 'kb:revchg', name: 'B2B · Reverse charge (art. 17)', regime: 'Inversione contabile', channel: 'B2B', markup_pct: 150, vat_rate: 0, deposit_pct: 50,
    terms: 'Operazione soggetta a inversione contabile ex art. 17 DPR 633/72.\nIVA assolta dal committente. Prezzi al netto d’imposta.' },
  { id: 'kb:export', name: 'Export extra-UE · non imponibile', regime: 'Non imponibile', channel: 'B2B', markup_pct: 150, vat_rate: 0, deposit_pct: 50,
    terms: 'Operazione non imponibile ai sensi dell’art. 8 DPR 633/72 (cessione all’esportazione).' },
];

// Normalizza una regola (DB o built-in) alla forma applicabile.
export function normalizeRule(r = {}) {
  return {
    id: r.id, name: r.name || 'Regola', regime: r.regime || null, builtin: String(r.id || '').startsWith('kb:'),
    channel: r.channel || null,
    markup_pct: r.markup_pct != null ? Number(r.markup_pct) : null,
    vat_rate: r.vat_rate != null ? Number(r.vat_rate) : null,
    line_discount_pct: r.line_discount_pct != null ? Number(r.line_discount_pct) : null,
    global_discount_pct: r.global_discount_pct != null ? Number(r.global_discount_pct) : null,
    deposit_pct: r.deposit_pct != null ? Number(r.deposit_pct) : null,
    express: r.express != null ? !!r.express : null,
    apply_qty_tiers: r.apply_qty_tiers != null ? !!r.apply_qty_tiers : null,
    terms: r.terms || null,
  };
}

// Applica la regola al documento editor: ritorna un NUOVO doc (pure, testabile).
// Imposta canale/opzioni a livello documento e markup/IVA/sconto su OGNI riga.
// I valori null della regola non toccano il campo corrispondente.
export function applyRule(doc, rule) {
  const r = normalizeRule(rule);
  const out = { ...doc };
  if (r.channel != null) out.channel = r.channel;
  if (r.global_discount_pct != null) out.global_discount_pct = r.global_discount_pct;
  if (r.deposit_pct != null) out.deposit_pct = r.deposit_pct;
  if (r.express != null) out.express = r.express;
  if (r.apply_qty_tiers != null) out.apply_qty_tiers = r.apply_qty_tiers;
  if (r.terms != null && String(r.terms).trim()) out.terms = r.terms;
  out.lines = (doc.lines || []).map((l) => {
    const nl = { ...l };
    if (r.markup_pct != null) nl.markup_pct = r.markup_pct;
    if (r.vat_rate != null) nl.vat_rate = r.vat_rate;
    if (r.line_discount_pct != null) nl.discount_pct = r.line_discount_pct;
    return nl;
  });
  return out;
}

// Snapshot della configurazione corrente del documento come regola salvabile.
export function docToRule(doc, name, regime) {
  const first = (doc.lines || [])[0] || {};
  return {
    name: String(name || '').trim(), regime: regime || null,
    channel: doc.channel || null,
    markup_pct: first.markup_pct != null ? Number(first.markup_pct) : null,
    vat_rate: first.vat_rate != null ? Number(first.vat_rate) : null,
    line_discount_pct: first.discount_pct != null ? Number(first.discount_pct) : null,
    global_discount_pct: Number(doc.global_discount_pct) || 0,
    deposit_pct: Number(doc.deposit_pct) || 0,
    express: !!doc.express, apply_qty_tiers: !!doc.apply_qty_tiers,
    terms: doc.terms || null,
  };
}

// Elenco: preset KB built-in + regole salvate dall'utente (se backend presente).
export async function listRules(sb, opts = {}) {
  let saved = [];
  try {
    const { data, error } = await sb.from('pricing_rule').select('*').is('deleted_at', null)
      .order('created_at', { ascending: false }).limit(opts.limit || 200);
    if (error) throw error;
    saved = (data || []).map(normalizeRule);
  } catch (_) { saved = []; } // backend non configurato: solo built-in
  return [...DEFAULT_RULES.map(normalizeRule), ...saved];
}

export async function saveRule(sb, tenantId, rule) {
  if (!rule || !String(rule.name || '').trim()) throw new Error('Nome regola obbligatorio.');
  const row = { tenant_id: tenantId, ...docToRuleRow(rule) };
  const { data, error } = await sb.from('pricing_rule').insert(row).select().single();
  if (error) throw error;
  return normalizeRule(data);
}

// Colonne DB (whitelist): niente campi estranei nel payload.
function docToRuleRow(rule) {
  const r = normalizeRule(rule);
  return {
    name: r.name, regime: r.regime, channel: r.channel, markup_pct: r.markup_pct, vat_rate: r.vat_rate,
    line_discount_pct: r.line_discount_pct, global_discount_pct: r.global_discount_pct, deposit_pct: r.deposit_pct,
    express: r.express, apply_qty_tiers: r.apply_qty_tiers, terms: r.terms,
  };
}

export async function softDeleteRule(sb, id) {
  if (String(id || '').startsWith('kb:')) throw new Error('I preset KB non sono eliminabili.');
  const { error } = await sb.from('pricing_rule').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return true;
}
