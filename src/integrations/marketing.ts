/* ═══════════════════════════════════════════════════════════════════════════
   INGLY integrations — MARKETING & ANALYTICS (Fase 4, contratti)
   Sorgenti metriche (GA4, Meta/Google Ads, Instagram) normalizzate per la Home
   Intelligence. Compatibile con connettori tipo Windsor.ai. Calcoli puri testabili.
   ═══════════════════════════════════════════════════════════════════════════ */
import { num } from '../core/format';

export type MarketingSourceId = 'ga4' | 'meta_ads' | 'google_ads' | 'instagram' | 'tiktok';

export interface MarketingMetrics {
  source: MarketingSourceId;
  period: string;        // es. '2026-08'
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  revenue: number;
}

export interface MarketingSource {
  readonly id: MarketingSourceId;
  metrics(period: string): Promise<MarketingMetrics>;
}

/** ROAS = ricavi / spesa (0 se spesa nulla). */
export function roas(m: Pick<MarketingMetrics, 'revenue' | 'spend'>): number {
  return num(m.spend) > 0 ? num(m.revenue) / num(m.spend) : 0;
}
/** CPA = spesa / conversioni (null se nessuna conversione). */
export function cpa(m: Pick<MarketingMetrics, 'spend' | 'conversions'>): number | null {
  return num(m.conversions) > 0 ? num(m.spend) / num(m.conversions) : null;
}
/** CTR = click / impression (0 se nessuna impression). */
export function ctr(m: Pick<MarketingMetrics, 'clicks' | 'impressions'>): number {
  return num(m.impressions) > 0 ? num(m.clicks) / num(m.impressions) : 0;
}
/** Aggrega più sorgenti in un totale (per il cruscotto). */
export function aggregate(list: MarketingMetrics[]): Omit<MarketingMetrics, 'source' | 'period'> {
  return (list || []).reduce(
    (a, m) => ({
      spend: a.spend + num(m.spend), clicks: a.clicks + num(m.clicks),
      impressions: a.impressions + num(m.impressions), conversions: a.conversions + num(m.conversions),
      revenue: a.revenue + num(m.revenue),
    }),
    { spend: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0 },
  );
}
