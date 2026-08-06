/* ═══════════════════════════════════════════════════════════════════════════
   INGLY integrations — SPEDIZIONI (Fase 4, contratti)
   Interfaccia provider spedizioni (Qapla'/Spedire/corriere) + tipi normalizzati.
   Il backend implementa le chiamate reali; qui contratti + helper puri.
   ═══════════════════════════════════════════════════════════════════════════ */
import { num } from '../core/format';

export interface Address { name: string; street: string; city: string; zip: string; country: string; }
export interface ShipmentRequest { orderId: string; to: Address; weightKg: number; parcels?: number; }
export interface Shipment { trackingCode: string; carrier: string; labelUrl?: string; status: ShipmentStatus; }
export type ShipmentStatus = 'creata' | 'in_transito' | 'consegnata' | 'giacenza' | 'errore';

export interface ShippingProvider {
  readonly name: string;
  createLabel(req: ShipmentRequest): Promise<Shipment>;
  track(trackingCode: string): Promise<ShipmentStatus>;
}

/** Stima peso volumetrico (cm³ / 5000 = kg) — standard corrieri. */
export function volumetricWeight(lengthCm: number, widthCm: number, heightCm: number): number {
  return (num(lengthCm) * num(widthCm) * num(heightCm)) / 5000;
}
/** Peso tassabile: max tra reale e volumetrico. */
export function billableWeight(realKg: number, volumetricKg: number): number {
  return Math.max(num(realKg), num(volumetricKg));
}
