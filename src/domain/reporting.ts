/* ═══════════════════════════════════════════════════════════════════════════
   INGLY domain — BI / REPORTING (Fase 5, logica pura testabile)
   Aggregazioni per il cruscotto direzionale: ricavi per canale/mese, margine,
   ripartizione cassa profit-first (KB), forecast semplice. Nessuna infrastruttura.
   Fonte regole cassa: .claude/rules/ecommerce-rules.md
   (15% tasse · 10% riserva · 15% obiettivi · 60% operativo).
   ═══════════════════════════════════════════════════════════════════════════ */
import { num } from '../core/format';

export interface SaleLike { total?: number; amount?: number; channel?: string; date?: string | number; createdAt?: string | number; cost?: number; }

function total(s: SaleLike): number { return num(s.total ?? s.amount ?? 0); }
function monthKey(v: string | number | undefined): string {
  const t = typeof v === 'number' ? v : Date.parse(String(v ?? ''));
  const d = Number.isFinite(t) ? new Date(t) : new Date();
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
}

/** Ricavi aggregati per canale. */
export function revenueByChannel(sales: SaleLike[]): Record<string, number> {
  const out: Record<string, number> = {};
  (sales || []).forEach((s) => { const c = s.channel || 'diretto'; out[c] = (out[c] || 0) + total(s); });
  return out;
}

/** Ricavi aggregati per mese (YYYY-MM), ordinati. */
export function revenueByMonth(sales: SaleLike[]): Array<{ month: string; revenue: number }> {
  const map: Record<string, number> = {};
  (sales || []).forEach((s) => { const k = monthKey(s.date ?? s.createdAt); map[k] = (map[k] || 0) + total(s); });
  return Object.keys(map).sort().map((month) => ({ month, revenue: map[month] }));
}

/** Margine complessivo (ricavi - costi) e percentuale. */
export function marginSummary(sales: SaleLike[]): { revenue: number; cost: number; margin: number; marginPct: number } {
  let revenue = 0, cost = 0;
  (sales || []).forEach((s) => { revenue += total(s); cost += num(s.cost); });
  const margin = revenue - cost;
  return { revenue, cost, margin, marginPct: revenue > 0 ? margin / revenue : 0 };
}

/** Ripartizione cassa profit-first (regola KB). */
export const CASH_SPLIT = { tasse: 0.15, riserva: 0.10, obiettivi: 0.15, operativo: 0.60 } as const;
export function profitFirstSplit(amount: number): Record<keyof typeof CASH_SPLIT, number> {
  const a = num(amount);
  return {
    tasse: +(a * CASH_SPLIT.tasse).toFixed(2),
    riserva: +(a * CASH_SPLIT.riserva).toFixed(2),
    obiettivi: +(a * CASH_SPLIT.obiettivi).toFixed(2),
    operativo: +(a * CASH_SPLIT.operativo).toFixed(2),
  };
}

/** Forecast del mese prossimo con media mobile semplice (default 3 mesi). */
export function forecastNextMonth(monthly: Array<{ month: string; revenue: number }>, window = 3): number {
  if (!monthly || !monthly.length) return 0;
  const last = monthly.slice(-window);
  const sum = last.reduce((s, m) => s + num(m.revenue), 0);
  return +(sum / last.length).toFixed(2);
}
