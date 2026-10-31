// INGLY OS V2 — Lab & Lista Acquisti (data-layer). Lista attrezzatura/consumabili
// da acquistare, con costo e stato. CRUD reale, RLS/RBAC 'tools.lab'. Migr. 0036.
import { friendlyError, canWrite, canDelete } from './crm.js';
export { friendlyError, canWrite, canDelete };

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
export const LAB_PRIORITIES = ['low', 'normal', 'high'];

export async function listLabItems(sb, opts = {}) {
  let q = sb.from('lab_item').select('*').is('deleted_at', null);
  if (opts.onlyToBuy) q = q.eq('bought', false);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(opts.limit || 500);
  if (error) throw error;
  return data || [];
}

// Totale ancora da acquistare (quantità × costo unitario) sui non comprati.
export function remainingCost(list) {
  return r2((list || []).filter((i) => !i.bought).reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_cost || 0), 0));
}

const CLEAN = ['name', 'category', 'quantity', 'unit_cost', 'priority', 'bought', 'notes'];
function sanitize(patch) {
  const out = {};
  for (const k of CLEAN) if (k in patch) out[k] = patch[k];
  if ('quantity' in out) out.quantity = Math.max(0, Number(out.quantity) || 0);
  if ('unit_cost' in out) out.unit_cost = Math.max(0, Number(out.unit_cost) || 0);
  if ('priority' in out && !LAB_PRIORITIES.includes(out.priority)) out.priority = 'normal';
  if ('bought' in out) out.bought = !!out.bought;
  return out;
}

export async function createLabItem(sb, tenantId, data) {
  const row = { tenant_id: tenantId, quantity: 1, unit_cost: 0, priority: 'normal', bought: false, ...sanitize(data || {}) };
  if (!row.name) throw new Error('Nome articolo obbligatorio.');
  const { data: out, error } = await sb.from('lab_item').insert(row).select().single();
  if (error) throw error; return out;
}

export async function updateLabItem(sb, id, patch) {
  const { data, error } = await sb.from('lab_item').update({ ...sanitize(patch || {}), updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error; return data;
}

export async function softDeleteLabItem(sb, id) {
  const { error } = await sb.from('lab_item').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error; return true;
}
