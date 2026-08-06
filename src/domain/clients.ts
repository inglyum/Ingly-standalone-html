/* ═══════════════════════════════════════════════════════════════════════════
   INGLY domain — CLIENTI / CRM: segmentazione + CLV (puro, testabile)
   Segmentazione RFM-lite (Recency, Frequency, Monetary) allineata al concetto
   KB "Clienti top (Champion)". Stima CLV semplice per prioritizzare la relazione.
   ═══════════════════════════════════════════════════════════════════════════ */
import { num } from '../core/format';

export type Segment = 'champion' | 'fedele' | 'a_rischio' | 'nuovo' | 'inattivo';

export interface OrderRef { total?: number; amount?: number; date?: string | number; createdAt?: string | number; }
export interface ClientStats {
  orders: number;        // frequency
  revenue: number;       // monetary totale
  avgOrder: number;
  lastDays: number | null; // recency in giorni (null se mai)
  segment: Segment;
  clv: number;           // stima valore cliente
}

function orderTotal(o: OrderRef): number { return num(o.total ?? o.amount ?? 0); }
function orderTs(o: OrderRef): number {
  const v = o.date ?? o.createdAt ?? 0;
  const t = typeof v === 'number' ? v : Date.parse(String(v));
  return Number.isFinite(t) ? t : 0;
}

/** Statistiche + segmento di un cliente dai suoi ordini. */
export function clientStats(clientOrders: OrderRef[], now: number = Date.now()): ClientStats {
  const list = clientOrders || [];
  const orders = list.length;
  const revenue = list.reduce((s, o) => s + orderTotal(o), 0);
  const avgOrder = orders > 0 ? revenue / orders : 0;
  const lastTs = list.reduce((m, o) => Math.max(m, orderTs(o)), 0);
  const lastDays = lastTs > 0 ? Math.floor((now - lastTs) / 864e5) : null;
  const segment = segmentOf(orders, revenue, lastDays);
  // CLV semplice: valore medio × frequenza attesa (proxy: ordini) × fattore fedeltà.
  const loyalty = segment === 'champion' ? 1.5 : segment === 'fedele' ? 1.2 : 1;
  const clv = Math.round(avgOrder * Math.max(1, orders) * loyalty);
  return { orders, revenue, avgOrder, lastDays, segment, clv };
}

/** Regole di segmentazione (soglie pragmatiche, tarabili). */
export function segmentOf(orders: number, revenue: number, lastDays: number | null): Segment {
  if (orders === 0) return 'nuovo';
  if (lastDays != null && lastDays > 180) return 'inattivo';
  if (orders >= 4 && revenue >= 300 && (lastDays == null || lastDays <= 90)) return 'champion';
  if (orders >= 2 && (lastDays == null || lastDays <= 120)) return 'fedele';
  if (lastDays != null && lastDays > 90) return 'a_rischio';
  return 'nuovo';
}

/** Etichetta leggibile del segmento. */
export function segmentLabel(s: Segment): string {
  return ({ champion: '🏆 Champion', fedele: '💛 Fedele', a_rischio: '⚠️ A rischio', nuovo: '✨ Nuovo', inattivo: '💤 Inattivo' } as Record<Segment, string>)[s];
}

/** Ordina i clienti per priorità di relazione (CLV desc, champion in cima). */
export function rankByValue<T extends { stats: ClientStats }>(clients: T[]): T[] {
  const order: Segment[] = ['champion', 'fedele', 'a_rischio', 'nuovo', 'inattivo'];
  return clients.slice().sort((a, b) =>
    order.indexOf(a.stats.segment) - order.indexOf(b.stats.segment) || b.stats.clv - a.stats.clv);
}
