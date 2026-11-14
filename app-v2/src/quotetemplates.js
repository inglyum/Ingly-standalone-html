// INGLY OS V2 — Modelli di preventivo (data-layer). Pattern v96 quote_templates.
// Salva/riusa una configurazione completa dello Smart Quoter (righe, lavorazioni,
// opzioni prezzo) come modello. CRUD reale, RLS/RBAC 'sales.quote_template'.
// Dipende da migr. 0039.
import { friendlyError, canWrite, canDelete } from './crm.js';
export { friendlyError, canWrite, canDelete };

// Campi del documento Quoter da congelare nel modello (NO cliente/numero/stato).
const DOC_KEYS = ['title', 'category', 'channel', 'express', 'global_discount_pct', 'apply_qty_tiers', 'deposit_pct', 'notes', 'lines'];

// Estrae dal doc dell'editor lo snapshot riutilizzabile (senza dati cliente).
export function docToTemplate(doc) {
  const out = {};
  for (const k of DOC_KEYS) if (k in (doc || {})) out[k] = doc[k];
  // le righe perdono eventuali id/prezzi salvati: restano config pure
  out.lines = (doc.lines || []).map((l) => ({
    description: l.description || '', product_id: l.product_id || null, quantity: l.quantity != null ? l.quantity : 1,
    markup_pct: l.markup_pct != null ? l.markup_pct : 100, discount_pct: l.discount_pct || 0, vat_rate: l.vat_rate != null ? l.vat_rate : 22,
    spec: l.spec || '', workings: Array.isArray(l.workings) ? l.workings.map((x) => ({ ...x })) : [],
  }));
  return out;
}

// Applica un modello: ritorna un doc pronto per l'editor (cliente svuotato).
export function templateToDoc(tpl) {
  const d = (tpl && tpl.doc) || {};
  return {
    title: d.title || '', customer_id: '', customer_name: '',
    priority: 'normal', category: d.category || '', channel: d.channel || 'CUSTOM',
    express: !!d.express, global_discount_pct: d.global_discount_pct || 0, apply_qty_tiers: !!d.apply_qty_tiers,
    notes: d.notes || '', valid_until: '', deposit_pct: d.deposit_pct || 0,
    lines: Array.isArray(d.lines) && d.lines.length ? d.lines.map((l) => ({ ...l })) : null,
  };
}

export async function listTemplates(sb, opts = {}) {
  const { data, error } = await sb.from('quote_template').select('*').is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(opts.limit || 200);
  if (error) throw error;
  return data || [];
}

export async function saveTemplate(sb, tenantId, name, doc, category) {
  if (!name || !String(name).trim()) throw new Error('Nome modello obbligatorio.');
  const row = { tenant_id: tenantId, name: String(name).trim(), category: category || null, doc: docToTemplate(doc) };
  const { data, error } = await sb.from('quote_template').insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function softDeleteTemplate(sb, id) {
  const { error } = await sb.from('quote_template').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return true;
}
