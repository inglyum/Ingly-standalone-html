/* ═══════════════════════════════════════════════════════════════════════════
   INGLY domain — MOTORE DI PREVENTIVO (puro, testabile)
   Compone il pricing KB (src/core/pricing.ts) in un preventivo completo:
   righe con quantità e sconti, totale, minimo d'ordine, acconto e validità.
   Regole KB (.claude/rules/ecommerce-rules.md):
   • Sconti quantità: 10+ −10%, 25+ −15%, 50+ −20% (cumulabili solo così).
   • Acconto 50% su personalizzati > €50.
   • Preventivo: validità 7 giorni.
   ═══════════════════════════════════════════════════════════════════════════ */
import { num, to90 } from '../core/format';
import { computePrice, qtyDiscount, orderMeetsMinimum, KB, type Channel, type PriceInput } from '../core/pricing';

export interface QuoteLineInput extends PriceInput {
  label?: string;
  qty?: number;
  custom?: boolean; // personalizzato (rilevante per l'acconto)
}
export interface QuoteLineResult {
  label: string;
  qty: number;
  unit: number;          // prezzo unitario (dal pricing KB, ,90)
  discount: number;      // sconto quantità 0..1
  lineTotal: number;     // qty * unit * (1 - discount), ,90
  margin: number;        // margine unitario 0..1
  custom: boolean;
}
export interface QuoteResult {
  lines: QuoteLineResult[];
  subtotal: number;         // somma dei lineTotal
  meetsOrderMinimum: boolean;
  hasCustomOver50: boolean; // esiste personalizzazione che fa scattare l'acconto
  deposit: number;          // acconto richiesto (50% del subtotale se applicabile)
  validUntil: string;       // ISO date (oggi + 7 giorni)
  channel: Channel;
}

/** Calcola una singola riga di preventivo. */
export function computeQuoteLine(line: QuoteLineInput): QuoteLineResult {
  const qty = Math.max(1, Math.floor(num(line.qty ?? 1)));
  const p = computePrice(line);
  const discount = qtyDiscount(qty);
  const lineTotal = to90(qty * p.price * (1 - discount));
  return {
    label: line.label || 'Articolo',
    qty, unit: p.price, discount, lineTotal, margin: p.margin,
    custom: !!line.custom,
  };
}

/** Data di validità del preventivo: oggi + 7 giorni (KB). */
export function quoteValidUntil(from: Date = new Date()): string {
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

/** Calcola l'intero preventivo da un elenco di righe. */
export function computeQuote(lines: QuoteLineInput[], channel: Channel = 'b2c'): QuoteResult {
  const out = (lines || []).map((l) => computeQuoteLine({ channel, ...l }));
  const subtotal = to90(out.reduce((s, l) => s + l.lineTotal, 0));
  // Acconto 50% se esiste una riga personalizzata e il subtotale supera €50 (KB).
  const hasCustom = out.some((l) => l.custom);
  const hasCustomOver50 = hasCustom && subtotal > 50;
  const deposit = hasCustomOver50 ? to90(subtotal * 0.5) : 0;
  return {
    lines: out,
    subtotal,
    meetsOrderMinimum: orderMeetsMinimum(subtotal),
    hasCustomOver50,
    deposit,
    validUntil: quoteValidUntil(),
    channel,
  };
}

export { KB };
