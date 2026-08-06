# Fase 2 — Backend, sync local-first & auth/RBAC (contratti pronti)

Stato: **schema + contratti + logica pura pronti e testati**. Manca l'infrastruttura
(Postgres, hosting, provider auth) per far girare la sincronizzazione reale.

## Cosa c'è già
- `db/schema.sql` — schema **Postgres multi-tenant** derivato dagli store:
  piattaforma (tenants, users, sessions, audit_log, sync_changes) + entità
  business (clients, catalog, materials, equipment, suppliers, orders, quotes,
  invoices, cashflow). Pattern: colonne tipizzate + `data jsonb` per il resto.
  Row-Level Security per isolamento tenant (esempio incluso).
- `src/core/auth.ts` — ruoli (owner/admin/operator/accountant/viewer), matrice
  permessi, `can(role, resource, action)` **puro e testato**, validità sessione.
- `src/core/sync.ts` — contratti `SyncEngine` (push/pull), `ChangeRecord`,
  risoluzione **Last-Write-Wins** (`resolveLWW`, `mergeChanges`, `cursorFrom`) testati.

## Architettura local-first
```
IndexedDB (client, offline)  ──push──▶  sync_changes (Postgres)
        ▲                                     │
        └───────────── pull ◀─────────────────┘   (cursore = max updated_at)
```
- Il client continua a funzionare offline; alla riconnessione fa push dei cambi
  locali (da `_upd`) e pull dei remoti. Conflitti risolti LWW (default).
- Il token di sessione vive in **cookie httpOnly+SameSite** lato server — mai in
  localStorage/bundle.

## Come si completa quando c'è il backend
1. **DB**: applicare `db/schema.sql` (Supabase/Postgres), abilitare RLS su tutte
   le tabelle business, impostare `app.tenant_id` dalla sessione verificata.
2. **Auth**: OIDC (Supabase Auth / Auth0). Il ruolo dell'utente guida `can()`
   lato client (UI gating) E lato server (autorizzazione reale — mai fidarsi solo del client).
3. **Sync engine**: implementare `SyncEngine.push/pull` (edge function o API).
   Opzioni mature: **ElectricSQL** o **PowerSync** (sync Postgres↔local pronto),
   oppure custom sulla tabella `sync_changes`.
4. **Migrazione dati**: export dal client (già disponibile: DataTools/exportAll) →
   import per-tenant nelle tabelle (colonne tipizzate + resto in `data`).

## Vincoli (regole del progetto)
- Autorizzazione server-side sempre; `can()` lato client è solo UX.
- Nessun segreto nel client. Validazione input server-side. Audit log immutabile.
