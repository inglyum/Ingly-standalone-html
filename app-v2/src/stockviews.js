// INGLY OS V2 — Viste tipizzate di magazzino (data-layer). Vernici, Componenti,
// Gadget NON sono anagrafiche separate: sono VISTE sulla stessa master-data
// materiali (catalog_product kind='material'), filtrate per tipo. Una sola
// source of truth (decisione DECISIONS.md). + Supplier Intelligence: analisi
// deterministica della spesa fornitori. Read-only, con fonte.
import { listMaterials } from './materials.js';
import { listPurchases } from './purchases.js';
import { listSuppliers } from './suppliers.js';
import { friendlyError } from './crm.js';
export { friendlyError };

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const safe = async (p, f) => { try { return await p; } catch (_) { return f; } };

// Classificatore fine per le tre viste (regex sul tipo/categoria del materiale).
const VIEW_RE = {
  paint: /vern|paint|bombolet|smalt|paint/i,
  component: /compon|minuter|vite|magnet|accessor|cernier|clip/i,
  gadget: /gadget|led|portachiav|calamit|spilla|segnapost/i,
};

export function materialMatchesView(m, view) {
  const t = String((m && (m.material_type || m.subcategory || m.category)) || '');
  const re = VIEW_RE[view];
  return re ? re.test(t) : true;
}

// Vista tipizzata: materiali filtrati per una delle viste (paint/component/gadget).
// Arricchiti con stock reale (da listMaterials). Fonte dichiarata.
export async function loadTypedStock(sb, view) {
  const mats = await safe(listMaterials(sb, {}), []);
  const items = mats.filter((m) => materialMatchesView(m, view));
  const totalValue = r2(items.reduce((s, m) => s + (m.stockValue || 0), 0));
  const below = items.filter((m) => m.below).length;
  return { view, items, totalValue, below, source: `Materiali (catalog_product kind=material) filtrati come "${view}" — stessa master-data, nessuna tabella separata`, error: null };
}

// ── SUPPLIER INTELLIGENCE — spesa, ordini, ultimo acquisto per fornitore.
export async function loadSupplierIntel(sb) {
  const [purchases, suppliers] = await Promise.all([
    safe(listPurchases(sb, { limit: 2000 }), []), safe(listSuppliers(sb, { limit: 1000 }), []),
  ]);
  const active = purchases.filter((p) => p.status !== 'CANCELLED');
  const by = {};
  for (const p of active) {
    const k = p.supplier_name || p.supplier_id || '—';
    by[k] = by[k] || { name: p.supplier_name || '—', orders: 0, spend: 0, last: '0000-00-00' };
    by[k].orders += 1; by[k].spend += Number(p.total || 0);
    const d = p.order_date || '';
    if (d > by[k].last) by[k].last = d;
  }
  const items = Object.values(by).map((s) => ({
    name: s.name, orders: s.orders, spend: r2(s.spend),
    avgOrder: s.orders ? r2(s.spend / s.orders) : 0, last: s.last > '0000-00-00' ? s.last : null,
    source: `Acquisti → ${s.orders} ordini al fornitore`,
  })).sort((a, b) => b.spend - a.spend);
  const totalSpend = r2(items.reduce((s, x) => s + x.spend, 0));
  // Concentrazione: quota del primo fornitore sul totale (rischio dipendenza).
  const topShare = totalSpend > 0 && items[0] ? Math.round(items[0].spend / totalSpend * 100) : 0;
  return { items, totalSpend, topShare, suppliersCount: suppliers.length, source: 'purchase_order + supplier (dati reali)', error: null };
}
