/* ═══════════════════════════════════════════════════════════════════════════
   INGLY domain — FISCO IT (Fase 3, contratti + logica pura)
   IVA, numerazione documenti, costruzione fattura da preventivo. NON parla con
   lo SDI: prepara un oggetto fattura NORMALIZZATO pronto per un intermediario
   (Fatture in Cloud / ACube / Aruba). Zero infrastruttura richiesta qui.
   ═══════════════════════════════════════════════════════════════════════════ */
import { num } from '../core/format';
import type { QuoteResult } from './quote';

/** Aliquote IVA italiane comuni. */
export const IVA = { standard: 0.22, reduced10: 0.10, reduced4: 0.04, zero: 0 } as const;
export type VatRate = number;

export interface VatSplit { imponibile: number; imposta: number; totale: number; rate: VatRate; }

function round2(n: number): number { return Math.round((num(n) + Number.EPSILON) * 100) / 100; }

/** Scorpora l'IVA da un prezzo IVA-inclusa (tipico B2C). */
export function splitFromGross(gross: number, rate: VatRate = IVA.standard): VatSplit {
  const g = num(gross);
  const imponibile = round2(g / (1 + rate));
  const imposta = round2(g - imponibile);
  return { imponibile, imposta, totale: round2(g), rate };
}
/** Aggiunge l'IVA a un imponibile netto (tipico B2B). */
export function addVat(net: number, rate: VatRate = IVA.standard): VatSplit {
  const imponibile = round2(net);
  const imposta = round2(imponibile * rate);
  return { imponibile, imposta, totale: round2(imponibile + imposta), rate };
}

/** Numero documento progressivo per sezionale/anno. Es. "2026/000123". */
export function formatDocNumber(seq: number, year: number = new Date().getFullYear(), sezionale = ''): string {
  const n = String(Math.max(1, Math.floor(num(seq)))).padStart(6, '0');
  return (sezionale ? sezionale + '/' : '') + year + '/' + n;
}

export type DocType = 'preventivo' | 'proforma' | 'fattura' | 'fattura_acconto' | 'nota_credito';

export interface InvoiceLine { description: string; qty: number; unitGross: number; rate: VatRate; }
export interface InvoiceParty { name?: string; piva?: string; cf?: string; address?: string; sdiCode?: string; pec?: string; }
export interface Invoice {
  docType: DocType;
  number: string;
  date: string;         // ISO
  seller?: InvoiceParty;
  buyer?: InvoiceParty;
  lines: InvoiceLine[];
  imponibile: number;
  imposta: number;
  totale: number;
  vatBreakdown: VatSplit[]; // per aliquota
  currency: 'EUR';
}

/** Costruisce una fattura NORMALIZZATA da un preventivo (prezzi IVA-inclusa). */
export function buildInvoiceFromQuote(
  quote: QuoteResult,
  opts: { seq: number; year?: number; sezionale?: string; date?: string; rate?: VatRate; docType?: DocType; seller?: InvoiceParty; buyer?: InvoiceParty } = { seq: 1 },
): Invoice {
  const rate = opts.rate ?? IVA.standard;
  const lines: InvoiceLine[] = quote.lines.map((l) => ({ description: l.label, qty: l.qty, unitGross: l.unit, rate }));
  // totale = subtotale del preventivo (già IVA-inclusa)
  const split = splitFromGross(quote.subtotal, rate);
  return {
    docType: opts.docType ?? 'fattura',
    number: formatDocNumber(opts.seq, opts.year, opts.sezionale),
    date: opts.date ?? new Date().toISOString().slice(0, 10),
    seller: opts.seller,
    buyer: opts.buyer,
    lines,
    imponibile: split.imponibile,
    imposta: split.imposta,
    totale: split.totale,
    vatBreakdown: [split],
    currency: 'EUR',
  };
}

/** Fattura d'acconto (50%) coerente con la regola KB sui personalizzati >€50. */
export function buildDepositInvoice(quote: QuoteResult, opts: { seq: number; year?: number; sezionale?: string; rate?: VatRate; seller?: InvoiceParty; buyer?: InvoiceParty }): Invoice | null {
  if (!(quote.deposit > 0)) return null;
  const rate = opts.rate ?? IVA.standard;
  const split = splitFromGross(quote.deposit, rate);
  return {
    docType: 'fattura_acconto',
    number: formatDocNumber(opts.seq, opts.year, opts.sezionale),
    date: new Date().toISOString().slice(0, 10),
    seller: opts.seller, buyer: opts.buyer,
    lines: [{ description: 'Acconto 50% su ordine personalizzato', qty: 1, unitGross: quote.deposit, rate }],
    imponibile: split.imponibile, imposta: split.imposta, totale: split.totale,
    vatBreakdown: [split], currency: 'EUR',
  };
}
