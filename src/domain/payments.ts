/* ═══════════════════════════════════════════════════════════════════════════
   INGLY domain — PAGAMENTI (Fase 3, contratti provider-agnostici)
   Astrazione dei pagamenti: nessun dato carta gestito in casa (delega PCI a
   Stripe). Qui: tipi, stato, calcolo acconto/saldo e un'interfaccia provider che
   il backend implementerà (Stripe, bonifico, ecc.). Zero infrastruttura qui.
   ═══════════════════════════════════════════════════════════════════════════ */
import { num } from '../core/format';

export type PaymentMethod = 'stripe' | 'bonifico' | 'contanti' | 'paypal';
export type PaymentStatus = 'in_attesa' | 'autorizzato' | 'pagato' | 'rimborsato' | 'fallito';

export interface PaymentIntent {
  id?: string;
  amount: number;       // in euro
  currency: 'EUR';
  method: PaymentMethod;
  status: PaymentStatus;
  reference?: string;   // id provider / causale
  orderId?: string | number;
  createdAt: string;
}

/** Contratto che il backend implementa per ogni provider (es. Stripe). */
export interface PaymentProvider {
  readonly name: PaymentMethod;
  /** Crea un intent di pagamento (il client NON tocca i dati carta). */
  createIntent(amount: number, opts?: { orderId?: string | number; reference?: string }): Promise<PaymentIntent>;
  /** Stato aggiornato dell'intent. */
  status(id: string): Promise<PaymentStatus>;
}

/** Ripartizione acconto/saldo secondo la regola KB (acconto 50%). */
export interface PaymentPlan { deposit: number; balance: number; depositPct: number; }
export function paymentPlan(total: number, deposit: number): PaymentPlan {
  const t = num(total), d = Math.min(num(deposit), t);
  return { deposit: d, balance: Math.max(0, t - d), depositPct: t > 0 ? d / t : 0 };
}

/** Provider fittizio per test/sviluppo offline (nessuna rete). */
export function mockProvider(method: PaymentMethod = 'stripe'): PaymentProvider {
  const store: Record<string, PaymentIntent> = {};
  return {
    name: method,
    async createIntent(amount, opts = {}) {
      const id = 'pi_mock_' + Date.now() + '_' + Math.floor(Math.random() * 999);
      const intent: PaymentIntent = {
        id, amount: num(amount), currency: 'EUR', method,
        status: 'in_attesa', reference: opts.reference, orderId: opts.orderId,
        createdAt: new Date().toISOString(),
      };
      store[id] = intent;
      return intent;
    },
    async status(id) { return store[id]?.status ?? 'fallito'; },
  };
}
