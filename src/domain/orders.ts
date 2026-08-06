/* ═══════════════════════════════════════════════════════════════════════════
   INGLY domain — ORDINI: modello di stato + KPI (puro, testabile)
   Stati canonici + alias legacy allineati a `updateOrderStatus` del monolite.
   KPI KB (.claude/rules/ecommerce-rules.md): settimana ricavi ≥ €375,
   conversione ≥ 40%, ticket medio ≥ €45.
   ═══════════════════════════════════════════════════════════════════════════ */
import { num } from '../core/format';

export type OrderStatus =
  | 'preventivo' | 'inviato' | 'accettato' | 'rifiutato'
  | 'produzione' | 'completato' | 'venduto' | 'annullato';

/** Alias legacy → stato canonico (compat con OrderFlow del monolite). */
export const STATUS_ALIAS: Record<string, OrderStatus> = {
  draft: 'preventivo', sent: 'inviato', accepted: 'accettato', rejected: 'rifiutato',
  production: 'produzione', working: 'produzione', completed: 'completato',
  delivered: 'venduto', paid: 'venduto', sold: 'venduto', invoiced: 'venduto',
  ready: 'completato', backlog: 'preventivo',
};

export function canonicalStatus(s: string): OrderStatus | null {
  const k = String(s || '').toLowerCase();
  if ((['preventivo', 'inviato', 'accettato', 'rifiutato', 'produzione', 'completato', 'venduto', 'annullato'] as string[]).includes(k)) return k as OrderStatus;
  return STATUS_ALIAS[k] || null;
}

/** Transizioni ammesse tra stati canonici. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  preventivo: ['inviato', 'annullato'],
  inviato: ['accettato', 'rifiutato', 'annullato'],
  accettato: ['produzione', 'annullato'],
  produzione: ['completato', 'annullato'],
  completato: ['venduto'],
  venduto: [],
  rifiutato: ['preventivo'],
  annullato: [],
};
export function canTransition(from: string, to: string): boolean {
  const f = canonicalStatus(from), t = canonicalStatus(to);
  if (!f || !t) return false;
  return TRANSITIONS[f].includes(t);
}

export const CLOSED_WON: OrderStatus[] = ['completato', 'venduto'];
export const OPEN: OrderStatus[] = ['preventivo', 'inviato', 'accettato', 'produzione'];
export function isWon(s: string): boolean { const c = canonicalStatus(s); return !!c && CLOSED_WON.includes(c); }
export function isOpen(s: string): boolean { const c = canonicalStatus(s); return !!c && OPEN.includes(c); }

/** Target KPI KB. */
export const KPI_TARGET = { weekRevenue: 375, conversion: 0.40, avgTicket: 45 } as const;

export interface OrderLike { status?: string; stage?: string; total?: number; amount?: number; }
function total(o: OrderLike): number { return num(o.total ?? o.amount ?? 0); }
function statusOf(o: OrderLike): string { return String(o.status ?? o.stage ?? ''); }

export interface OrdersKpi {
  won: number; open: number; total: number;
  revenue: number; avgTicket: number; conversion: number;
  meetsRevenue: boolean; meetsConversion: boolean; meetsAvgTicket: boolean;
}

/** KPI da un elenco di ordini (già filtrato per periodo, es. settimana). */
export function computeKpi(orders: OrderLike[]): OrdersKpi {
  let won = 0, open = 0, revenue = 0;
  (orders || []).forEach((o) => {
    const s = statusOf(o);
    if (isWon(s)) { won++; revenue += total(o); }
    else if (isOpen(s)) open++;
  });
  const decided = won + open; // preventivi decisi/da decidere considerati
  const conversion = decided > 0 ? won / decided : 0;
  const avgTicket = won > 0 ? revenue / won : 0;
  return {
    won, open, total: decided, revenue, avgTicket, conversion,
    meetsRevenue: revenue >= KPI_TARGET.weekRevenue,
    meetsConversion: conversion >= KPI_TARGET.conversion,
    meetsAvgTicket: avgTicket >= KPI_TARGET.avgTicket,
  };
}
