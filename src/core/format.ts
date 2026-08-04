/* INGLY core — utility di formattazione (pure, senza side effect, testabili). */

/** Numero robusto: ritorna il fallback se non finito. */
export function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}

/** Valuta in Euro, locale italiano, senza decimali per default. */
export function eur(v: unknown, decimals = 0): string {
  return '€' + num(v).toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Arrotonda al ,90 psicologico (regola pricing KB). */
export function to90(v: number): number {
  return Math.floor(num(v)) + 0.90;
}

/** Clamp in [min,max]. */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Percentuale intera 0..100 di parte/tot (0 se tot<=0). */
export function pct(part: number, tot: number): number {
  return tot > 0 ? clamp(Math.round((num(part) / num(tot)) * 100), 0, 100) : 0;
}

/** Data ISO breve YYYY-MM-DD da timestamp/stringa. */
export function isoDate(v: number | string | Date = Date.now()): string {
  return new Date(v).toISOString().slice(0, 10);
}
