/* ═══════════════════════════════════════════════════════════════════════════
   INGLY integrations — E-COMMERCE / OMNICHANNEL (Fase 4, contratti + normalizzatori)
   Interfaccia canale + normalizzatori PURI (testabili) che mappano ordini/prodotti
   esterni (Etsy/Shopify/WooCommerce) nella forma interna del gestionale. Il fetch
   reale (rete/OAuth) lo fa il backend che implementa `SalesChannel`.
   ═══════════════════════════════════════════════════════════════════════════ */
import { num } from '../core/format';

export type ChannelId = 'etsy' | 'shopify' | 'woocommerce' | 'amazon';

/** Ordine interno normalizzato (compat con lo store 'orders'). */
export interface NormalizedOrder {
  id: string;
  source: ChannelId;
  externalId: string;
  status: string;         // stato canonico interno
  total: number;
  currency: string;
  clientName?: string;
  createdAt: string;      // ISO
  lines: Array<{ sku?: string; title: string; qty: number; price: number }>;
}

/** Prodotto interno normalizzato (compat con lo store 'catalog'). */
export interface NormalizedProduct {
  id: string;
  source: ChannelId;
  externalId: string;
  name: string;
  price: number;
  sku?: string;
}

/** Contratto che il backend implementa per ogni canale (OAuth/rete lato server). */
export interface SalesChannel {
  readonly id: ChannelId;
  fetchOrders(since?: string): Promise<NormalizedOrder[]>;
  pushProduct(p: NormalizedProduct): Promise<{ externalId: string }>;
}

/** Mappa lo stato esterno → stato canonico interno. */
export function mapStatus(_source: ChannelId, raw: string): string {
  const s = String(raw || '').toLowerCase();
  const common: Record<string, string> = {
    paid: 'venduto', completed: 'venduto', fulfilled: 'venduto', shipped: 'venduto',
    open: 'preventivo', pending: 'inviato', unpaid: 'inviato',
    canceled: 'annullato', cancelled: 'annullato', refunded: 'annullato',
  };
  return common[s] || 'inviato';
}

/** Normalizza un ordine "Etsy-like" (receipt) nella forma interna. */
export function normalizeEtsyOrder(receipt: any): NormalizedOrder {
  const ext = String(receipt.receipt_id ?? receipt.id ?? '');
  const lines = (receipt.transactions || receipt.line_items || []).map((t: any) => ({
    sku: t.sku, title: t.title || t.name || 'Articolo',
    qty: num(t.quantity ?? t.qty ?? 1), price: num(t.price?.amount ?? t.price ?? 0),
  }));
  const total = num(receipt.grandtotal?.amount ?? receipt.total ?? lines.reduce((s: number, l: any) => s + l.price * l.qty, 0));
  return {
    id: 'etsy_' + ext, source: 'etsy', externalId: ext,
    status: mapStatus('etsy', receipt.status || (receipt.is_paid ? 'paid' : 'open')),
    total, currency: receipt.currency_code || 'EUR',
    clientName: receipt.name || receipt.buyer_name,
    createdAt: receipt.created_timestamp ? new Date(num(receipt.created_timestamp) * 1000).toISOString() : new Date().toISOString(),
    lines,
  };
}

/** Normalizza un ordine "Shopify-like". */
export function normalizeShopifyOrder(o: any): NormalizedOrder {
  const ext = String(o.id ?? o.order_number ?? '');
  const lines = (o.line_items || []).map((l: any) => ({ sku: l.sku, title: l.title || l.name || 'Articolo', qty: num(l.quantity ?? 1), price: num(l.price ?? 0) }));
  return {
    id: 'shopify_' + ext, source: 'shopify', externalId: ext,
    status: mapStatus('shopify', o.financial_status || o.fulfillment_status || 'pending'),
    total: num(o.total_price ?? 0), currency: o.currency || 'EUR',
    clientName: o.customer ? [o.customer.first_name, o.customer.last_name].filter(Boolean).join(' ') : undefined,
    createdAt: o.created_at || new Date().toISOString(), lines,
  };
}
