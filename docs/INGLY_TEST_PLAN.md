# INGLY OS — Test Plan

> Principio: *una funzione non è completa perché la pagina si apre.* Devono funzionare **dati, azioni, validazioni, persistenza e relazioni**.
> Strumenti già disponibili nel repo: `.claude/scripts/verify-syntax.mjs` (sintassi JS di tutti i blocchi `<script>`), Playwright preinstallato (smoke/E2E sul monolite), suite `tests/run.mjs` + `*.test.mjs` (per il codice modulare app-v2).

## 1. Livelli di test
| Livello | Oggetto | Strumento | Quando |
|---|---|---|---|
| Sintassi | tutti i `<script>` del monolite | `verify-syntax.mjs` | **Prima di ogni commit** |
| Smoke runtime | boot + navigazione sezioni | Playwright (0 pageerror) | ogni sprint |
| Unit | funzioni pure (pricing, costing, migrazioni) | node test harness | per funzione nuova |
| Integrazione | relazioni tra entità (cliente↔ordine↔fattura) | Playwright + IDB | per flusso |
| Migrazioni | idempotenza, conteggi pre/post | node + IDB mock | per migrazione |
| Regressione | funzioni esistenti invariate | checklist + Playwright | ogni sprint |

## 2. Gate obbligatori prima di ogni commit
1. `node .claude/scripts/verify-syntax.mjs INGLY-OS-v53-AV2.html` → **130 blocchi, 0 errori**.
2. Smoke Playwright: boot pulito (localStorage vuoto), creazione admin, navigazione ≥10 sezioni, **0 pageerror** (gli errori CDN offline non contano).
3. Backup file aggiornato se si tocca lo schema/dati.

## 3. Test per entità (CRUD) — da implementare Sprint 2+
Per ciascuna entità canonica (Contact, Product, Item, Quotation, Order, PO, Invoice, Payment, …):
- [ ] Create con validazione campi obbligatori.
- [ ] Read per id e per query indicizzata.
- [ ] Update con `updatedAt` aggiornato.
- [ ] Delete coerente (soft-delete o cascade dichiarato).
- [ ] Persistenza verificata riaprendo il DB.

## 4. Test di relazione / flusso (integrazione)
- [ ] Cliente → Preventivo → Ordine: stesso `clientId`, nessun reinserimento dati.
- [ ] Preventivo accettato → Ordine (conversione `PreventivToOrder`) senza perdita righe.
- [ ] Ordine consegnato → Fattura (`FatturaDaOrdine`) con importi coerenti.
- [ ] Fabbisogno → PO fornitore → ricezione → **carico magazzino** (`items`) con quantità aggiornate (ciclo già presente: verificare post-unificazione `items`).
- [ ] Prenotazione/consumo stock su conferma ordine di produzione (quando MRP sarà presente).
- [ ] Marginalità commessa: costo reale (`cost_entries`) vs prezzo → margine atteso.

## 5. Test migrazioni (Sprint 1+)
- [ ] Ogni migrazione è **idempotente**: seconda esecuzione = nessun cambiamento.
- [ ] Conteggi record pre/post coerenti (nessuna perdita/duplicazione).
- [ ] Id originali conservati.
- [ ] Rollback/restore da backup funzionante (round-trip).
- [ ] `orders`/`pipeline`: dopo canonicalizzazione, nessun ordine perso e Kanban invariato per l'utente.
- [ ] `items`: valore/quantità magazzino identici prima/dopo l'adapter.

## 6. Test backup & restore
- [ ] Export completo di tutti gli store → JSON.
- [ ] Import su DB vuoto → conteggi identici.
- [ ] Import su DB esistente → merge senza duplicati (id stabili).

## 7. Test offline
- [ ] Boot e navigazione funzionano offline (shim `Chart` attivo, nessun crash).
- [ ] Funzioni che richiedono CDN (grafici/PDF) degradano senza errori bloccanti.
- [ ] Nessuna chiamata esterna necessaria per le operazioni core (CRUD/quoter/ordini).

## 8. Test permessi (prep SaaS)
- [ ] Ruoli UI (owner/admin/manager/staff/viewer) nascondono le azioni non consentite.
- [ ] **Nota:** finché l'auth è client-side, i test permessi verificano solo la UX, **non** la sicurezza reale (che sarà server-side).

## 9. Regressione (ogni sprint)
Checklist delle funzioni esistenti toccate dallo sprint: devono restare invariate per l'utente. Confronto screenshot Playwright prima/dopo per le viste modificate (già usato per i fix UI).

## 10. Criterio di “done” per sprint
Uno sprint è concluso solo se: verify-syntax verde · smoke 0 pageerror · test CRUD/flusso dello sprint passano · backup/restore ok · regressione ok · report redatto.
