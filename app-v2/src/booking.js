// INGLY OS V2 — Booking (data-layer). Prenotazioni/appuntamenti con stato.
// CRUD reale, RLS/RBAC 'ops.booking'. Dipende da migr. 0034.
import { friendlyError, canWrite, canDelete } from './crm.js';
export { friendlyError, canWrite, canDelete };

export const BOOKING_STATUSES = ['requested', 'confirmed', 'done', 'cancelled'];
export const BOOKING_STATUS_LABEL = { requested: 'Richiesto', confirmed: 'Confermato', done: 'Completato', cancelled: 'Annullato' };

export async function listBookings(sb, opts = {}) {
  let q = sb.from('booking').select('*').is('deleted_at', null);
  if (opts.status) q = q.eq('status', opts.status);
  const { data, error } = await q.order('slot_date', { ascending: true }).limit(opts.limit || 500);
  if (error) throw error;
  return data || [];
}

const CLEAN = ['customer_id', 'customer_name', 'service', 'slot_date', 'slot_time', 'status', 'notes'];
function sanitize(patch) {
  const out = {};
  for (const k of CLEAN) if (k in patch) out[k] = patch[k];
  if ('status' in out && !BOOKING_STATUSES.includes(out.status)) out.status = 'requested';
  if ('customer_id' in out && !out.customer_id) out.customer_id = null;
  if ('slot_date' in out && !out.slot_date) out.slot_date = null;
  return out;
}

export async function createBooking(sb, tenantId, data) {
  const row = { tenant_id: tenantId, status: 'requested', ...sanitize(data || {}) };
  if (!row.customer_name && !row.service) throw new Error('Indica almeno cliente o servizio.');
  const { data: out, error } = await sb.from('booking').insert(row).select().single();
  if (error) throw error; return out;
}

export async function updateBooking(sb, id, patch) {
  const { data, error } = await sb.from('booking').update({ ...sanitize(patch || {}), updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error; return data;
}

export async function softDeleteBooking(sb, id) {
  const { error } = await sb.from('booking').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error; return true;
}
