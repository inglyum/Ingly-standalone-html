# INGLY OS — Data Migrations

> Strategia di migrazione **sequenziale, atomica, idempotente** per `InglyMasterDB`.
> Regola d'oro: **non eliminare vecchi store** finché non è dimostrato che tutti i moduli usano il nuovo modello. Conservare gli id originali. Backup prima di ogni migrazione.

## 1. Stato attuale (da audit)
- `InglyMasterDB` v30, 56 store. Array `MIGRATIONS` con **1 sola voce no-op** (`{from:0,to:13}`). Migrazioni di campo **lazy** in `migrateRecord()` per 6 store.
- Apertura con `Math.max(VER, versioneBrowser)` (mitiga “version less than existing”).
- DB separato `InglyDB` v3.
- Molto stato in `localStorage` (325 setItem).

→ **Non esiste un framework di migrazione reale.** Questo è il primo intervento dello Sprint 1.

## 2. Framework migrazioni proposto (Sprint 1)
Struttura (non distruttiva, additiva):
```
MIGRATIONS = [
  { v: 31, name: 'add-timestamps', idempotent: true, data: async (tx) => { /* aggiunge createdAt/updatedAt dove mancano */ } },
  { v: 32, name: 'orders-canonical', ... },
  { v: 33, name: 'items-adapter', ... },
  ...
]
```
Regole:
1. **Schema** (`createObjectStore`/`createIndex`) solo in `onupgradeneeded`, sempre `if(!contains)`.
2. **Dati**: migrazioni dati eseguite in transazione, **idempotenti** (riapplicabili senza danni), con flag `_mig:<v>` sul record o un record `settings.migrations_applied`.
3. **Mai** drop di store in questa fase. Deprecazione = sola lettura + adapter.
4. **Integrità**: contare record prima/dopo; se mismatch → abort + log, non proseguire.
5. **Rollback**: ogni migrazione dati salva un `backups` snapshot del/i store toccati prima di modificare.

## 3. Migrazione #1 — Timestamps uniformi (v31)
- Per ogni store con entità di dominio: se `createdAt` manca → impostarlo (fallback: id/time se derivabile, altrimenti `now`), `updatedAt = createdAt`.
- Idempotente: salta i record che già li hanno.
- Nessun altro campo toccato.

## 4. Migrazione #2 — Ordini fonte canonica (v32)
**Decisione proposta:** `orders` canonico (uso reale 330 vs 102 di `pipeline`).
- `pipeline` → diventa **proiezione read-only** derivata da `orders` (stato/fase). Nessun doppio write.
- Adapter `OrdersCanonical`: ogni scrittura passa da qui; le API pipeline esistenti leggono la proiezione.
- Backfill: unire eventuali record presenti solo in `pipeline` dentro `orders` conservando id; marcare `_source`.
- `quotes`/`sales` restano come sono (già read-only storici).
- **Verifica:** nessun ordine perso, conteggi coerenti, Kanban `GestioneOrdini` invariato per l'utente.

## 5. Migrazione #3 — Adozione `items` (v33)
- Adapter `ItemsAdapter`: letture/scritture di `inventory/materials/components/gadgets` reindirizzate a `items` con campo `kind` (`inventory|material|component|gadget`).
- Backfill: copiare i record legacy in `items` conservando id (prefisso `kind:` se collisione), senza cancellare i legacy (sola lettura).
- Le viste magazzino leggono da `items` filtrando per `kind`.
- **Verifica:** quantità/valore magazzino identici prima/dopo; nessun doppio conteggio.

## 6. Migrazione #4 — localStorage → DB (v34)
- Individuare i dati di dominio in localStorage (es. movimenti magazzino, code riordino `ingly_reorders`, preset prezzi) e creare store dedicati (`inventory_moves`, `reorder_queue`, `pricing_presets`).
- Copiare i dati, mantenendo la chiave localStorage come fallback read finché non confermato.
- Lasciare in localStorage **solo** preferenze UI per-viewer (tema, lingua, filtro, collapse).

## 7. Migrazione #5 — Riconciliazione `InglyDB` (v35)
- Analizzare cosa scrive `InglyDB` v3 (riga ~41954). Se è dato di dominio → copiarlo in `InglyMasterDB`; altrimenti documentarlo come storage dedicato isolato.

## 8. Procedura di backup verificabile (pre-migrazione)
1. `BackupEngine.exportAll()` → JSON completo di tutti gli store (già esiste logica export).
2. Salvare lo snapshot in store `backups` **e** offrire download file.
3. Registrare `settings.last_backup = { ts, counts }`.
4. Solo dopo backup riuscito → eseguire la migrazione.
5. `BackupEngine.restore(json)` testato in round-trip prima del rilascio.

## 9. Checklist integrità (ogni migrazione)
- [ ] Backup creato e conteggi registrati.
- [ ] Migrazione idempotente (riesecuzione = no-op).
- [ ] Conteggi record pre/post coerenti.
- [ ] Id originali conservati.
- [ ] Nessun errore silenzioso in operazioni bulk (ogni fallimento logga e blocca).
- [ ] Vecchi store intatti (sola lettura), non eliminati.
- [ ] Smoke test viste collegate invariate per l'utente.
