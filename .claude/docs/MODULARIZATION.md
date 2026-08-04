# Modularizzazione INGLY OS — piano strangler-fig (Fase 1)

## Obiettivo
Sciogliere il monolite `INGLY-OS-vNN-STANDALONE.html` (~100k righe in un file) in
moduli TypeScript tipizzati e testabili, **senza** perdere la distribuzione
offline a file singolo e **senza** big-bang rewrite.

## Come funziona (strangler-fig)
Si estrae **un modulo alla volta** dal monolite verso `src/`, si builda a file
singolo con Vite, e il monolite continua a funzionare. Ogni passo è rilasciabile
e reversibile. Il nuovo codice "avvolge" gradualmente il vecchio finché il
monolite non è svuotato.

```
src/
  main.ts                 # entry: registra i moduli estratti (boot)
  modules/
    design-system.ts      # ✅ ESTRATTO (proof of concept) → window.DS
    data-tools.ts         # ⏳ prossimo
    market-hub.ts         # ⏳
    audit-log.ts          # ⏳
    machine-invest.ts     # ⏳
    erp-intel.ts          # ⏳
  core/                   # IDB wrapper, Bus, AppStore (fondamenta condivise)
```

## Build
- `npm run typecheck` — TypeScript strict, zero errori.
- `npm run build` — Vite + `vite-plugin-singlefile` → `dist/ingly-modules.js`
  (IIFE, tutto inline, CSP-safe, offline). Verificato: ~3.7 kB per il solo DS.
- Il bundle espone le stesse API globali del monolite (`window.DS`, ...) →
  **compatibilità 1:1**. Si può iniettare il bundle nel monolite al posto del
  relativo `<script>`, oppure caricarlo a parte.

## Ordine di estrazione consigliato (dal più isolato al più accoppiato)
1. **Design System** (`DS`) — ✅ fatto: nessuna dipendenza, alta riusabilità.
2. **Utility pure** (formattazione €, date, num) — nessun side effect.
3. **Core** (`IDB`, `Bus`, `AppStore`) — fondamenta; contratti dati tipizzati.
4. **Moduli enterprise v60–v74** (DataTools, MarketHub, AuditLog, MachineInvest,
   ERPIntel, InglyIcons) — già scritti in modo isolato/additivo: candidati ideali.
5. **Sezioni di dominio** (preventivatore, ordini, clienti) — le più accoppiate,
   per ultime, una alla volta con test di regressione a protezione.

## Regole
- Ogni modulo estratto **mantiene l'API globale** usata dal monolite finché la
  migrazione non è completa (nessuna rottura runtime).
- Ogni estrazione passa da `npm run check` (verify-syntax del monolite + suite
  test) prima del commit.
- `App.navigate` resta intoccato (`writable:false, configurable:false`) — vedi
  `.claude/playbooks/bug-fix.md` (incidente freeze v53).
- Nessun segreto nel bundle (è distribuibile/ispezionabile come il monolite).
