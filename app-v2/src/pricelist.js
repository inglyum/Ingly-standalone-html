// INGLY OS V2 — Listini per cliente (data-layer). Pattern v96 client_pricelists.
// Prezzo/sconto concordato per (cliente, prodotto): lo Smart Quoter lo applica.
// CRUD reale, RLS/RBAC 'sales.pricelist'. Dipende da migr. 0040.
import { friendlyError, canWrite, canDelete } from './crm.js';
export { friendlyError, canWrite, canDelete };

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export async function listForCustomer(sb, customerId, opts = {}) {
  const { data, error } = await sb.from('client_pricelist').select('*')
    .eq('customer_id', customerId).is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(opts.limit || 500);
  if (error) throw error;
  return data || [];
}

// Mappa product_id → voce di listino, per lookup rapido nel Quoter.
export async function mapForCustomer(sb, customerId) {
  const rows = await listForCustomer(sb, customerId, {});
  return Object.fromEntries(rows.map((r) => [String(r.product_id), r]));
}

// Prezzo effettivo concordato per un prodotto dato il listino (prezzo fisso o
// sconto% sul prezzo di listino passato). Null se nessun accordo.
export function agreedUnitPrice(entry, listPrice) {
  if (!entry) return null;
  if (Number(entry.agreed_price) > 0) return r2(entry.agreed_price);
  if (Number(entry.discount_pct) > 0) return r2((Number(listPrice) || 0) * (1 - entry.discount_pct / 100));
  return null;
}

export async function setPrice(sb, tenantId, customerId, productId, data) {
  const clean = {
    tenant_id: tenantId, customer_id: customerId, product_id: productId,
    agreed_price: data.agreed_price === '' || data.agreed_price == null ? null : Math.max(0, Number(data.agreed_price) || 0),
    discount_pct: Math.min(95, Math.max(0, Number(data.discount_pct) || 0)),
    notes: data.notes || null,
  };
  // upsert manuale (unique customer_id+product_id): aggiorna se esiste.
  const existing = (await listForCustomer(sb, customerId, {})).find((r) => String(r.product_id) === String(productId));
  if (existing) {
    const { data: out, error } = await sb.from('client_pricelist').update({ ...clean, updated_at: new Date().toISOString() }).eq('id', existing.id).select().single();
    if (error) throw error; return out;
  }
  const { data: out, error } = await sb.from('client_pricelist').insert(clean).select().single();
  if (error) throw error; return out;
}

export async function removePrice(sb, id) {
  const { error } = await sb.from('client_pricelist').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error; return true;
}
