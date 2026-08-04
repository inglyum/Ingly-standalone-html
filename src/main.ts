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

// riesporta il core così è disponibile ai consumer del bundle
export * as format from './core/format';
export * as globals from './core/globals';

export function boot(): void {
  installDesignSystem();
  installIcons();
  installAuditLog();
  installMachineInvest();
  installERPIntel();
  installMarketHub();
  installDataTools();
}

boot();
