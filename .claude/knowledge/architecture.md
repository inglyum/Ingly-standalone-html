# INGLY OS — Architettura (stato attuale + traiettoria)

## Stato attuale: monolite single-file
- Un file `INGLY-OS-vN-STANDALONE.html`: markup + `<style>` + `<script>` inline.
- Vanilla JS, nessun build, nessun npm, CSP-safe (tutto vendored).
- **Dati:** `IDB` = wrapper IndexedDB (~52 store, DB v30). Cache `AppStore`.
- **Eventi:** doppio bus `Bus` (dati) + `NavBus` (navigazione).
- **Motori:** `KPIEngine`, `DataLayer` (aggregazione), `DecisionEngine` (alert
  business locali), `AILayer` (regole), `BDW` (single source of truth revenue),
  `BankFundsV2` (obiettivi/profit-first).
- **UI:** design system CSS in `:root`; header sezione `.module-header`; layer
  effetti condiviso `#v49-ui-polish`.
- **Versioning:** copia-in-avanti vN→vN+1; marcatore = `<title>`.

## Perché resta valido (per ora)
Offline-first nativo, zero infra, distribuibile come singolo file, ottimo per un
laboratorio artigiano single-user. Il vincolo diventa la manutenibilità oltre
una certa scala.

## Traiettoria enterprise (quando servirà)
Modularizzazione graduale verso l'obiettivo "Shopify/Linear-grade":
1. **Estrazione moduli** in file separati serviti staticamente (mantiene
   offline-first), build leggero (Vite) opzionale.
2. **Data layer**: valutare Dexie.js sopra IndexedDB per query/migrazioni; sync
   opzionale (local-first).
3. **Backend headless** (solo se ecommerce reale): Medusa/Payload separati;
   INGLY OS come admin/frontend. Pagamenti via Stripe (mai carte in-app).
4. **Automazione**: n8n come sidecar via webhook (follow-up, CRM, riordini).
5. **AI interna**: MCP + context engineering sulla KB.

Ogni passo è reversibile e non deve rompere l'esperienza offline-first attuale.
Vedi `.claude/docs/SKILL_ACQUISITION_REPORT.md` per gli strumenti valutati.
