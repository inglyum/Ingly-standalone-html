# System Inventory — INGLY OS SaaS (FASE ZERO)

**Data:** 2026-10-11 · **Branch:** `claude/ingly-os-dev-system-ddgv1f` · **Analista:** audit pre-implementazione (CTO command)
**Sorgenti target** (scelti dall'owner): `saas-source/INGLY-OS_14.html`, `saas-source/INGLY-CLOUD-ADMIN_11.html`

> ⚠️ Il numero nel nome file NON è la versione. Verifica effettuata:
> `INGLY-OS_14.html` è internamente **INGLY OS v96** (`<title>` + marker interni).
> `INGLY-CLOUD-ADMIN_11.html` è il pannello amministrativo cloud.

---

## 1. Artefatti e dimensioni (verificati)

| File | Righe | Peso | Identità interna |
|---|---:|---:|---|
| `saas-source/INGLY-OS_14.html` | 147.963 | 11,8 MB | INGLY OS v96 — Gestionale Artigiano Laser |
| `saas-source/INGLY-CLOUD-ADMIN_11.html` | 11.397 | 1,0 MB | INGLY Cloud Admin |

Entrambi sono **monoliti HTML standalone** (HTML+CSS+JS inline, nessun build step, nessun modulo ES esterno). Font/immagini inline in base64 (parte del peso).

## 2. Gestionale (OS v96) — moduli/sezioni

**113 sezioni** distinte (`data-view/section/route/tab`). Estratto verificato:
`dashboard, clients, clientintel, clv, catalog, items, equipment, gestione_ordini, kanban,
finance, fiscal, cashflow, bank_funds, fixed_costs, goals, lasercalc, laser_b2b, apparel,
analytics, kpi, forecaster, forecasting, ai, aicoach, bizai, decision, intel, barcode,
backup, calendar, booking, followup, b2bpitch, brand_identity, competitors, …`

Copre: CRM, catalogo/magazzino, ordini/produzione (kanban), preventivi (lasercalc/B2B),
finanza/fiscale, costi/margini, analytics, AI assistita, backup.

## 3. Persistenza (verificata via grep)

| Store | OS v96 | Admin |
|---|---|---|
| IndexedDB | **sì — dominante** (1049 rif. `IDB.`, 44 `IndexedDB`) | no |
| localStorage | sì (899 rif.) | **sì — unico locale** (62 rif.) |
| sessionStorage | sì (19) | no |
| Backend remoto | Supabase REST (PostgREST), jsonbin.io | **Supabase REST** (`Prefer: return=representation`) |

**Conseguenza:** OS e Admin **non condividono una fonte dati autorevole**. OS vive in IndexedDB locale; Admin parla a Supabase REST. Nessuna sincronizzazione reale verificata tra i due. (→ `functional-gaps` FG-1.)

## 4. Servizi esterni referenziati (frontend diretto)

| Servizio | OS v96 | Admin | Chiave |
|---|---|---|---|
| Anthropic / OpenAI / Groq / Gemini / OpenRouter | sì (`x-api-key`, `Bearer`) | — | **chiavi utente in localStorage** (`ingly_api_key`, `ingly_gemini_key`, `ingly_openrouter_key`, `ingly_groq_key`) |
| Supabase | sì | sì | anon/apikey nel frontend (nessun `service_role` — **verificato: 0 occorrenze**) |
| Stripe | riferimenti (51) | riferimenti (27) | da verificare lato server |
| Firebase | riferimenti (30) | 2 | — |
| jsonbin.io | 4 | — | — |
| WhatsApp | 43 `wa.me` | 2 | link manuali |

## 5. Autenticazione / autorizzazione (stato attuale)

- Logica di **ruolo e login lato client** (OS: 246× `password`, 165× `role`; Admin: `superadmin`, `role`, login form).
- Nessun `service_role` esposto (buono). L'autorizzazione reale dipende **interamente dalle policy RLS Supabase**, **non verificabili** da questi file (serve accesso al progetto Supabase → blocco credenziali).

## 6. Robustezza errori (verificata)

- **505 blocchi `catch(){}` vuoti** in OS v96; **23** in Admin. Silent error swallowing diffuso → salvataggi/sincronizzazioni possono fallire senza segnalazione. (→ `security-findings` SEC-4 / command §5.4.)

## 7. Build / test / CI esistenti

- Nessun build step per i monoliti (standalone). Il repo contiene test solo per il **sito statico** (`tests/test-admin.mjs`, `test-css.mjs`, `test-sito.mjs`) — non coprono i monoliti.
- Nessun harness di verifica sintattica per i monoliti → ogni modifica è oggi non verificata. (→ P0 guardrail, vedi roadmap.)
