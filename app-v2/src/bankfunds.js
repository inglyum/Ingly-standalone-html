// INGLY OS V2 — Bank & Funds (data-layer). Conti/casse/fondi con saldo, vista
// liquidità. CRUD reale, RLS/RBAC 'finance.bank' (lettura ristretta). Migr. 0035.
import { friendlyError, canWrite, canDelete } from './crm.js';
export { friendlyError, canWrite, canDelete };

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
export const BANK_KINDS = ['bank', 'cash', 'savings', 'other'];
export const BANK_KIND_LABEL = { bank: 'Banca', cash: 'Cassa', savings: 'Risparmio', other: 'Altro' };

export async function listAccounts(sb, opts = {}) {
  let q = sb.from('bank_account').select('*').is('deleted_at', null);
  if (opts.activeOnly) q = q.eq('active', true);
  const { data, error } = await q.order('name', { ascending: true }).limit(opts.limit || 500);
  if (error) throw error;
  return data || [];
}

export function totalLiquidity(list) {
  return r2((list || []).filter((a) => a.active !== false).reduce((s, a) => s + Number(a.balance || 0), 0));
}

const CLEAN = ['name', 'kind', 'balance', 'currency', 'notes', 'active'];
function sanitize(patch) {
  const out = {};
  for (const k of CLEAN) if (k in patch) out[k] = patch[k];
  if ('kind' in out && !BANK_KINDS.includes(out.kind)) out.kind = 'bank';
  if ('balance' in out) out.balance = Number(out.balance) || 0;
  if ('active' in out) out.active = !!out.active;
  return out;
}

export async function createAccount(sb, tenantId, data) {
  const row = { tenant_id: tenantId, kind: 'bank', balance: 0, currency: 'EUR', active: true, ...sanitize(data || {}) };
  if (!row.name) throw new Error('Nome conto obbligatorio.');
  const { data: out, error } = await sb.from('bank_account').insert(row).select().single();
  if (error) throw error; return out;
}

export async function updateAccount(sb, id, patch) {
  const { data, error } = await sb.from('bank_account').update({ ...sanitize(patch || {}), updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error; return data;
}

export async function softDeleteAccount(sb, id) {
  const { error } = await sb.from('bank_account').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error; return true;
}
