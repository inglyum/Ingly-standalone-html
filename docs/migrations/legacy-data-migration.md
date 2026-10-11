# Legacy Data Migration — INGLY OS SaaS (piano, da collaudare)

**Data:** 2026-10-11 · Stato: PIANO (collaudo bloccato da credenziali Supabase)

## Sorgente dati legacy (verificata)
- **OS v96**: IndexedDB locale (1049 rif. `IDB.`) + localStorage (899). Fonte primaria del gestionale.
- **Admin**: localStorage (62) + chiamate Supabase REST.
- **Nessuna fonte condivisa** oggi (vedi `docs/audit/module-map.md`).

## Percorso di migrazione (command §7) — da implementare e collaudare
1. **Backup integrale** IndexedDB + localStorage (export JSON) PRIMA di qualsiasi scrittura.
2. **Inventario store/chiavi**: enumerare object store IDB e chiavi localStorage effettive del monolite in esecuzione (richiede runtime browser — Playwright, prossimo incremento).
3. **Mappa vecchio→nuovo** modello (vedi `docs/audit/module-map.md` domini).
4. **Anteprima** dati importabili + **validazione** (duplicati, mancanti, non validi).
5. **Migrazione idempotente e ripetibile** (upsert per chiave naturale).
6. **Verifica conteggi/totali** + **report differenze**.
7. **Rollback** documentato.

## Regole
- Il DB server diventa fonte autorevole; IDB resta cache offline.
- Nessuna cancellazione/sostituzione dell'archivio locale senza migrazione verificata (command §3.4/§7).
- Idempotenza: una ri-esecuzione non deve duplicare record.

## Blocco
Collaudo reale impossibile senza progetto Supabase (egress `*.supabase.co` + token assenti) e senza estrazione runtime degli store IDB. Entrambi documentati come prerequisiti.
