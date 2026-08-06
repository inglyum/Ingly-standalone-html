# INGLY OS — Stato sviluppo (roadmap viva)

> Aggiornato ad ogni avanzamento. Legenda: ✅ fatto · 🟡 in corso · ⏳ da fare.
> Branch di sviluppo: `claude/ingly-os-dev-system-ddgv1f`.

## Colpo d'occhio
| Fase | Titolo | Stato |
|---|---|---|
| 0 | Rete di sicurezza (test + CI) | ✅ **completa** |
| 1 | Modularizzazione (Vite+TS, file singolo) | 🟡 **in corso** — moduli enterprise estratti; dominio iniziato |
| 2 | Backend, sync local-first, auth/RBAC | 🟡 **schema + contratti pronti** (manca infra) |
| 3 | Fisco IT (SDI) + pagamenti | ⏳ da fare |
| 4 | Integrazioni & omnichannel | ⏳ da fare |
| 5 | BI, SaaS multi-tenant, ops | ⏳ da fare |

---

## Fase 0 — Rete di sicurezza ✅
- ✅ Suite test flussi critici (`tests/critical.test.mjs`): boot, moduli, nav no-freeze, integrità dati, checkpoint/restore.
- ✅ Test del bundle modulare (`tests/bundle.test.mjs`).
- ✅ CI GitHub Actions (`.github/workflows/ci.yml`): verify → typecheck → build → test.
- ✅ npm scripts (`verify`, `test`, `typecheck`, `build`, `check`).

## Fase 1 — Modularizzazione 🟡
**Fondamenta** ✅
- ✅ Vite + TypeScript strict → build a **file singolo** (`dist/ingly-modules.js`).
- ✅ Core contratti tipizzati (`src/core/globals.ts`) + utility (`src/core/format.ts`).

**Moduli estratti** ✅ (8)
- ✅ Design System · Icone · AuditLog · MachineInvest · ERPIntel · MarketHub · DataTools.

**Dominio** 🟡
- ✅ Motore di pricing KB (`src/core/pricing.ts`) — estratto e testato.
- ✅ Motore di preventivo (`src/domain/quote.ts`) — righe, sconti quantità,
  totale, minimo ordine, acconto 50% (personalizzati >€50), validità 7 giorni.
- ✅ UI Preventivatore collegata al motore (v75): pannello "⚡ Preventivo rapido
  (motore KB)" nel preventivatore, calcola con `window.InglyDomain.quote`
  (bundle iniettato, installer idempotenti → nessun override dei moduli esistenti).
- ✅ Motore Ordini (`src/domain/orders.ts`) — stati canonici + alias legacy,
  transizioni valide, KPI KB (ricavi settimana/conversione/ticket medio).
- ✅ UI Ordini collegata (v76): "📊 KPI Ordini (motore KB)" calcola con `InglyDomain.orders`.
- ✅ Motore Clienti/CRM (`src/domain/clients.ts`) — segmentazione RFM-lite
  (Champion/Fedele/A rischio/Nuovo/Inattivo) + stima CLV + ranking.
- ✅ UI Clienti collegata (v76): "🏆 Segmentazione (motore KB)" con CLV e ranking.

**Integrazione col monolite** ⏳
- ⏳ Sostituire i blocchi `<script>` inline con il bundle, un modulo alla volta,
  con `npm run check` a ogni passo (gli `install*` sono idempotenti → convivono).

## Fase 2 — Backend & local-first 🟡 (schema + contratti pronti)
- ✅ Schema **Postgres multi-tenant** (`db/schema.sql`) derivato dagli store, con RLS.
- ✅ Contratti **sync local-first** (`src/core/sync.ts`) — push/pull + LWW, testati.
- ✅ **Auth/RBAC** (`src/core/auth.ts`) — ruoli + `can()` puro, testato.
- 📄 Architettura documentata in `.claude/docs/FASE2-BACKEND.md`.
- ⏳ Far girare DB/sync/auth reali — richiede infrastruttura (Postgres, hosting, OIDC).

## Fase 3 — Fisco IT & pagamenti 🟡 (contratti pronti)
- ✅ Logica IVA + numerazione + fattura da preventivo (`src/domain/fiscal.ts`) — testata.
- ✅ Contratti pagamenti provider-agnostici + piano acconto/saldo (`src/domain/payments.ts`) — testati.
- 📄 Approccio d'integrazione documentato in `.claude/docs/FASE3-FISCO.md`.
- ⏳ Fattura Elettronica SDI via intermediario (Fatture in Cloud / ACube / Aruba) — richiede backend.
- ⏳ Stripe (delega PCI) + riconciliazione bancaria (PSD2) — richiede backend.

## Fase 4 — Integrazioni & omnichannel ⏳
- ⏳ Canali e-commerce (Etsy/Shopify/WooCommerce) + vetrina pubblica collegata.
- ⏳ Spedizioni (Qapla'/Spedire) · Marketing (GA4/Meta) dentro Intelligence.

## Fase 5 — BI, SaaS, ops ⏳
- ⏳ Cruscotti direzionali/marginalità · multi-tenant + licenze · Sentry/monitoraggio · mobile (PWA).

---

## Metriche correnti
- Monolite: **v74** · 133 blocchi `<script>` · 0 errori sintassi.
- Bundle modulare: ~38 kB (8 moduli UI + core + dominio: pricing/quote/orders/clients).
- Motori di dominio puri e testati: **pricing · preventivo · ordini · clienti**.
- Test: **7/7 verdi** con assert sui valori KB (36.90, acconto 166.90, KPI, CLV 600).

## Prossimo passo consigliato
Collegare la **UI del preventivatore** del monolite al motore `quote.ts` (un
aggancio alla volta, con test di regressione), poi Ordini e Clienti. In parallelo,
preparare **schema dati + contratti Fase 2** (backend) pronti per l'infrastruttura.
