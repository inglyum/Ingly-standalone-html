/* ═══════════════════════════════════════════════════════════════════════════
   INGLY core — MOTORE DI PRICING (regole KB, puro e testabile)
   Fonte: .claude/rules/ecommerce-rules.md (Knowledge Base INGLY-OS).
   Formula: (Materiale + Macchina + Lavoro + Design) × Markup canale, → ,90.
   Non cambia la logica del monolite: è l'estrazione tipizzata delle regole,
   pronta per essere usata dal preventivatore (Fase 1 — dominio).
   ═══════════════════════════════════════════════════════════════════════════ */
import { num, to90 } from './format';

/** Costanti KB. */
export const KB = {
  LABOR_PER_HOUR: 18, // €/h
  SCRAP: 0.15,        // +15% sfrido materiale
  MARKUP: { b2c: 3, b2b: 2.5, etsy: 3.5 } as const,
  MIN_MARGIN: { b2c: 0.65, b2b: 0.55, etsy: 0.65 } as const,
  URGENCY_EXPRESS: 0.25, // +25% consegna <48h (opt-in)
  MIN_ORDER: 15,
  // Minimi psicologici per categoria (€)
  MIN_CATEGORY: {
    portachiavi: 6.90,
    cake_topper: 24.90,
    targa_a5: 29.90,
    qr_menu: 19.90,
  } as Record<string, number>,
  // Sconti quantità cumulabili solo secondo KB
  QTY_DISCOUNT: [
    { min: 50, off: 0.20 },
    { min: 25, off: 0.15 },
    { min: 10, off: 0.10 },
  ],
} as const;

export type Channel = 'b2c' | 'b2b' | 'etsy';

export interface PriceInput {
  material?: number;   // costo materiale grezzo (senza sfrido)
  machine?: number;    // costo macchina (ammortamento + energia)
  laborHours?: number; // ore di lavoro
  design?: number;     // costo design una tantum (0–30)
  channel?: Channel;
  urgency?: boolean;   // consegna <48h
  category?: string;   // per il minimo psicologico
}
export interface PriceResult {
  cost: number;        // costo pieno (con sfrido + lavoro + design + macchina)
  markup: number;      // moltiplicatore canale
  raw: number;         // prezzo prima di arrotondamento/minimi
  price: number;       // prezzo finale (,90, minimi applicati)
  margin: number;      // margine 0..1 sul prezzo finale
  minApplied: boolean; // true se ha vinto un minimo psicologico
}

/** Costo materiale con sfrido +15%. */
export function materialWithScrap(materialCost: number): number {
  return num(materialCost) * (1 + KB.SCRAP);
}
/** Costo del lavoro a €18/h. */
export function laborCost(hours: number): number {
  return num(hours) * KB.LABOR_PER_HOUR;
}

/** Calcola il prezzo di vendita secondo le regole KB. */
export function computePrice(inp: PriceInput): PriceResult {
  const channel: Channel = inp.channel || 'b2c';
  const markup = KB.MARKUP[channel];
  const cost =
    materialWithScrap(inp.material || 0) +
    num(inp.machine) +
    laborCost(inp.laborHours || 0) +
    num(inp.design);
  let raw = cost * markup;
  if (inp.urgency) raw *= 1 + KB.URGENCY_EXPRESS;
  let price = to90(raw);
  // minimo psicologico di CATEGORIA (a livello di articolo).
  // NB: il minimo d'ordine €15 è a livello di carrello, non di singolo pezzo →
  // vedi orderMeetsMinimum(). Un portachiavi a €6.90 è un articolo valido.
  let minApplied = false;
  const catMin = inp.category ? KB.MIN_CATEGORY[inp.category] : undefined;
  if (catMin != null && price < catMin) { price = catMin; minApplied = true; }
  const margin = price > 0 ? (price - cost) / price : 0;
  return { cost, markup, raw, price, margin, minApplied };
}

/** Il totale ordine rispetta il minimo KB (€15)? (controllo a livello carrello) */
export function orderMeetsMinimum(orderTotal: number): boolean {
  return num(orderTotal) >= KB.MIN_ORDER;
}

/** Sconto quantità ammesso dalla KB (0 se sotto soglia). */
export function qtyDiscount(qty: number): number {
  const q = num(qty);
  for (const t of KB.QTY_DISCOUNT) if (q >= t.min) return t.off;
  return 0;
}

/** Verifica se un prezzo rispetta il margine minimo del canale. */
export function meetsMinMargin(result: PriceResult, channel: Channel = 'b2c'): boolean {
  return result.margin >= KB.MIN_MARGIN[channel];
}
