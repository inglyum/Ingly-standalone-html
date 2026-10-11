# Target Architecture — INGLY OS SaaS (bozza, da approvare)

**Data:** 2026-10-11 · Stato: PROPOSTA (richiede decisione architettura — command §6)

## Decisione aperta (blocco business)
Due strade, da scegliere con l'owner:

- **A — Monolite migliorato in sicurezza**: mantenere i monoliti HTML standalone, estrarre un layer dati unico (adapter) verso un backend reale, correggere P0 in modo incrementale. Minor rischio di regressione funzionale, nessuna riscrittura.
- **B — Riscrittura graduale Next.js/TS** (command §6 default se "solo HTML monolitico"): dominio per dominio, mantenendo i monoliti come riferimento funzionale finché ogni dominio non è sostituito e verificato.

> La command impone: **non abbandonare funzioni senza alternativa verificata**. Qualsiasi strada parte dal mantenere i monoliti come reference (`saas-source/`).

## Backend di riferimento (entrambe le strade)
- PostgreSQL (Supabase) come **fonte autorevole** condivisa OS↔Admin.
- Auth provider (Supabase Auth): email verify, reset, MFA admin, sessioni, revoca.
- API server-side per operazioni riservate: authz, verifica piano/limiti, AI adapter, billing, notifiche.
- Storage sicuro per immagini/progetti. Stripe lato server. Adapter email/WhatsApp/AI.
- RLS per-tenant con test negativi d'isolamento.

## Multi-tenancy
`Organizations/Tenants` → `Memberships` → `Roles/Permissions`. Ogni tabella ERP con `tenant_id`, RLS `tenant_id = current_tenant()`. Isolamento provato da test negativi (command §18).

## Offline
IndexedDB resta **cache offline** (non fonte autorevole), con coda sync idempotente, versioning record, risoluzione conflitti esplicita (command §7).

## Prossimo passo architetturale
Scegliere A o B. Fino ad allora: P0 non distruttive + progettazione schema/adapter + test mock (già in corso), senza riscritture premature.
