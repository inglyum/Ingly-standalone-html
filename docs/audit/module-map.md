# Module Map & Data Flow — INGLY OS SaaS (FASE ZERO)

**Data:** 2026-10-11 · Sorgenti: `saas-source/INGLY-OS_14.html` (OS v96), `saas-source/INGLY-CLOUD-ADMIN_11.html`

## Mappa moduli storici → domini SaaS target (command §6)

| Dominio SaaS target | Moduli OS v96 / Admin corrispondenti |
|---|---|
| Identity & Access | login/role (OS+Admin), superadmin (Admin) |
| Organizations / Tenants | *(assente — da introdurre)* |
| CRM | clients, clientintel, clv, followup, b2bpitch |
| Catalog & Products | catalog, items, apparel, brand_identity |
| Pricing & Costing | lasercalc, laser_b2b, fixed_costs, dynamicprice |
| Quotes | lasercalc (preventivi), gestione_ordini (bozze) |
| Orders & Production | gestione_ordini, kanban, booking |
| Inventory & Materials | items, equipment, barcode |
| Machines | equipment, lasercalc (profili macchina) |
| Sales & Finance | finance, cashflow, bank_funds, fiscal, goals |
| Billing & Subscriptions | *(Admin: piani/licenze — da rendere reale)* |
| Projects & Files | imagelib, inglydesign, generator |
| Notifications | email, followup, wa.me (manuale) |
| AI Services | ai, aicoach, bizai, decision, intel, forecaster, forecasting |
| Analytics | analytics, kpi, dashboard |
| Admin & Audit | INGLY-CLOUD-ADMIN (utenti, piani, sessioni) |

> Regola: nessun modulo storico va abbandonato senza decisione esplicita + alternativa verificata (command §3.1, §6).

## Data flow attuale (verificato)

```
OS v96 (browser)  ──scrive/legge──>  IndexedDB locale (1049 rif.) + localStorage (899)
     │                                   (nessuna sync autorevole verificata)
     ├──AI──> browser ──x-api-key/Bearer──> Anthropic/OpenAI/Groq/Gemini/OpenRouter
     │        (chiave utente da localStorage: ingly_*_key)
     └──?──> Supabase REST / jsonbin.io   (uso parziale)

ADMIN (browser)   ──REST (PostgREST, apikey anon)──>  Supabase
     └── localStorage (62) per stato locale
```

## Data flow target (command §6/§7)

```
Browser (OS + Admin, STESSA fonte)
   └── API server-side (auth, authz, piani, limiti, AI adapter, billing, notifiche)
          └── PostgreSQL/Supabase (RLS per-tenant) ── Storage ── Stripe ── Email/WA/AI provider
Browser ⇄ IndexedDB SOLO come cache offline, con coda di sync idempotente e risoluzione conflitti.
```

**Gap chiave:** oggi OS (IndexedDB) e Admin (Supabase REST) **non condividono** utenti/aziende/dati/piani/sessioni. La "stessa chiave localStorage" NON è integrazione SaaS (command §7).
