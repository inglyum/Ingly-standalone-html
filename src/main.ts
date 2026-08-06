/* Entry point del bundle modulare INGLY OS (Fase 1 — strangler-fig).
   Man mano che i moduli vengono estratti dal monolite, si registrano qui.
   Il build produce UN singolo file JS (vite-plugin-singlefile) iniettabile nel
   monolite o usabile stand-alone. Le utility core (`format`, `globals`) sono
   condivise dai moduli. */
import { installDesignSystem } from './modules/design-system';
import { installIcons } from './modules/icons';
import { installAuditLog } from './modules/audit-log';
import { installMachineInvest } from './modules/machine-invest';
import { installERPIntel } from './modules/erp-intel';
import { installMarketHub } from './modules/market-hub';
import { installDataTools } from './modules/data-tools';
import * as pricingNS from './core/pricing';
import * as quoteNS from './domain/quote';
import * as ordersNS from './domain/orders';
import * as clientsNS from './domain/clients';
import * as formatNS from './core/format';
import * as fiscalNS from './domain/fiscal';
import * as paymentsNS from './domain/payments';

// riesporta il core così è disponibile ai consumer del bundle
export * as format from './core/format';
export * as globals from './core/globals';
export * as pricing from './core/pricing';
export * as quote from './domain/quote';
export * as orders from './domain/orders';
export * as clients from './domain/clients';
export * as fiscal from './domain/fiscal';
export * as payments from './domain/payments';
export * as auth from './core/auth';
export * as sync from './core/sync';

export function boot(): void {
  installDesignSystem();
  installIcons();
  installAuditLog();
  installMachineInvest();
  installERPIntel();
  installMarketHub();
  installDataTools();
  // Espone i motori di dominio puri per l'aggancio delle UI del monolite.
  if (typeof window !== 'undefined') {
    (window as any).InglyDomain = { pricing: pricingNS, quote: quoteNS, orders: ordersNS, clients: clientsNS, format: formatNS, fiscal: fiscalNS, payments: paymentsNS };
  }
}

boot();
