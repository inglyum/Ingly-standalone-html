// INGLY OS V2 — Team & HR (data-layer). Anagrafica collaboratori con costo
// orario interno. CRUD reale, RLS/RBAC 'system.team' (dati HR: lettura ristretta
// OWNER/ADMIN/MANAGER). Dipende da migr. 0033.
import { friendlyError, canWrite, canDelete } from './crm.js';
export { friendlyError, canWrite, canDelete };

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export async function listTeam(sb, opts = {}) {
  let q = sb.from('team_member').select('*').is('deleted_at', null);
  if (opts.activeOnly) q = q.eq('active', true);
  const { data, error } = await q.order('name', { ascending: true }).limit(opts.limit || 500);
  if (error) throw error;
  return data || [];
}

const CLEAN = ['name', 'role', 'email', 'phone', 'hourly_cost', 'active', 'notes'];
function sanitize(patch) {
  const out = {};
  for (const k of CLEAN) if (k in patch) out[k] = patch[k];
  if ('hourly_cost' in out) out.hourly_cost = out.hourly_cost === '' || out.hourly_cost == null ? null : Math.max(0, Number(out.hourly_cost) || 0);
  if ('active' in out) out.active = !!out.active;
  return out;
}

export async function createMember(sb, tenantId, data) {
  const row = { tenant_id: tenantId, active: true, ...sanitize(data || {}) };
  if (!row.name) throw new Error('Nome obbligatorio.');
  const { data: out, error } = await sb.from('team_member').insert(row).select().single();
  if (error) throw error; return out;
}

export async function updateMember(sb, id, patch) {
  const { data, error } = await sb.from('team_member').update({ ...sanitize(patch || {}), updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error; return data;
}

export async function softDeleteMember(sb, id) {
  const { error } = await sb.from('team_member').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error; return true;
}

// Costo orario medio del team attivo (per analisi manodopera). Deterministico.
export function avgHourlyCost(list) {
  const vals = (list || []).filter((m) => m.active && Number(m.hourly_cost) > 0).map((m) => Number(m.hourly_cost));
  if (!vals.length) return 0;
  return r2(vals.reduce((a, b) => a + b, 0) / vals.length);
}
