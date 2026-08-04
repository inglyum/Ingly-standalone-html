/* Entry point del bundle modulare INGLY OS (Fase 1 — proof of concept).
   Man mano che i moduli vengono estratti dal monolite (strangler-fig), si
   registrano qui. Oggi: Design System. Il build produce UN singolo file JS
   (vite-plugin-singlefile) iniettabile nel monolite o usabile stand-alone. */
import { installDesignSystem } from './modules/design-system';

export function boot(): void {
  installDesignSystem();
  // Prossime estrazioni: data-tools, market-hub, audit-log, ...
}

boot();
