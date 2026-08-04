# INGLY OS — Stato sviluppo (roadmap viva)

> Aggiornato ad ogni avanzamento. Legenda: ✅ fatto · 🟡 in corso · ⏳ da fare.
> Branch di sviluppo: `claude/ingly-os-dev-system-ddgv1f`.

## Colpo d'occhio
| Fase | Titolo | Stato |
|---|---|---|
| 0 | Rete di sicurezza (test + CI) | ✅ **completa** |
| 1 | Modularizzazione (Vite+TS, file singolo) | 🟡 **in corso** — moduli enterprise estratti; dominio iniziato |
| 2 | Backend, sync local-first, auth/RBAC | ⏳ da fare (richiede infrastruttura esterna) |
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
- ⏳ Preventivatore (usa il motore di pricing) — da estrarre.
- ⏳ Ordini / Pipeline — da estrarre.
- ⏳ Clienti / CRM — da estrarre.

**Integrazione col monolite** ⏳
- ⏳ Sostituire i blocchi `<script>` inline con il bundle, un modulo alla volta,
  con `npm run check` a ogni passo (gli `install*` sono idempotenti → convivono).

## Fase 2 — Backend & local-first ⏳
- ⏳ Schema Postgres derivato dai ~58 store.
- ⏳ Motore di sync IndexedDB ↔ server (ElectricSQL/PowerSync).
- ⏳ Auth OIDC + RBAC + audit per utente.
- ⚠️ **Nota:** richiede infrastruttura esterna (DB, hosting, auth) non attivabile
  nell'ambiente offline attuale — qui si possono preparare schema e contratti tipizzati.

## Fase 3 — Fisco IT & pagamenti ⏳
- ⏳ Fattura Elettronica SDI (intermediario: Fatture in Cloud / ACube / Aruba).
- ⏳ Corrispettivi, IVA, numerazione, acconti 50%.
- ⏳ Stripe + riconciliazione bancaria (PSD2).

## Fase 4 — Integrazioni & omnichannel ⏳
- ⏳ Canali e-commerce (Etsy/Shopify/WooCommerce) + vetrina pubblica collegata.
- ⏳ Spedizioni (Qapla'/Spedire) · Marketing (GA4/Meta) dentro Intelligence.

## Fase 5 — BI, SaaS, ops ⏳
- ⏳ Cruscotti direzionali/marginalità · multi-tenant + licenze · Sentry/monitoraggio · mobile (PWA).

---

## Metriche correnti
- Monolite: **v74** · 133 blocchi `<script>` · 0 errori sintassi.
- Bundle modulare: ~37 kB (8 moduli + core).
- Test: **7/7 verdi** (+ unit pricing).

## Prossimo passo consigliato
Estrarre il **preventivatore** appoggiandolo al nuovo `pricing.ts`, con test di
regressione che bloccano ogni divergenza dai valori KB.
