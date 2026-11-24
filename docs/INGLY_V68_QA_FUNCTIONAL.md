# INGLY OS v68 — QA Funzionale (browser reale)

> Test eseguiti aprendo l'ERP completo in un browser reale (Playwright su `file://`) — ciò che la QA v68 originale non aveva potuto fare (il loro Chromium bloccava `file://`). Guidati dall'interfaccia, con verifica su IndexedDB e dopo reload.
> Branch: `claude/ingly-v68-qa`. DB `InglyMasterDB` v31 invariato.

## Metodo
Per ogni flusso: azione dall'UI reale (apertura form, compilazione, salvataggio) → verifica che il dato sia scritto in **IndexedDB** → **reload** della pagina → verifica che il dato **persista**. Dialoghi `confirm()` auto-accettati. Si registrano `pageerror` e `console.error` reali (i fallimenti CDN offline non contano).

## Risultati

### GATE 2 — Runtime & navigazione
| Prova | Esito |
|---|---|
| Navigazione di **tutte le 108 sezioni** | ✅ 108/108, 0 pageerror, 0 console error reali |
| Sezione `crm_pipeline` (era rotta: `ClientPipeline` non definito) | ✅ implementato modulo reale, funziona |
| `Dashboard.updateKPIs` crash su `kpi` undefined | ✅ corretto (guardia) |
| `studio_ai` crash (`AIStudio.render` inesistente) | ✅ corretto (guardia su entrambi i call-site) |
| `esc()` crash su reload con dati (`(s||'').replace` su non-stringa) | ✅ corretto (`String(...)`) |

### GATE 2/4 — CRM (Clienti)
| Prova | Esito |
|---|---|
| Apertura form "Nuovo Cliente" | ✅ |
| `Clients.save()` → scrittura in IndexedDB (`clients`) | ✅ handler reale, dato persistito |
| **Persistenza dopo reload** | ✅ il cliente sopravvive al reload |

### GATE 4 — Catalogo
| Prova | Esito |
|---|---|
| Apertura form prodotto + `Catalog.save()` → `catalog` | ✅ |
| **Persistenza dopo reload** | ✅ |

### GATE 4 — Preventivo → Ordine (flusso critico)
Conversione `QuoterBridge.toOrder(quoteId)` su un preventivo con 3 righe:
| Invariante | Esito |
|---|---|
| Ordine creato in `orders` collegato al preventivo (`originQuote`) | ✅ |
| Valore ordine corretto | ✅ (150 su dato di prova) |
| Preventivo marcato `status:'produzione'` + `orderId` | ✅ |
| **Righe NON perse** (restano nel preventivo collegato) | ✅ nessuna perdita dati |
| **Dedup**: seconda conversione bloccata, nessun ordine duplicato | ✅ |

**Osservazione (non un bug):** l'ordine di produzione porta il **totale** e il **link** al preventivo, non copia le singole righe nell'ordine; il dettaglio resta nel preventivo (accessibile via `originQuote`). Nessun dato perso. Se in futuro serve il dettaglio righe direttamente sull'ordine (es. per la distinta di produzione), è un'estensione pianificabile (GATE 6).

### GATE 4 — Preventivo → Conferma → Vendita (flusso ricavi) 🔴 BUG CRITICO CORRETTO
Semantica reale v88: `QuoterBridge.convert` (override riga 26116) **non** crea più una vendita diretta — significa "cliente accetta → entra in **PRODUZIONE**" (crea/aggancia un ordine via `OrderFlow` e lo porta allo stage `production`). Il ricavo si registra **a valle**, quando l'ordine viene completato, via `AutoEngine.createSaleFromOrder` (vendita `status:'pagato'`). *(La vecchia `convert` che creava una vendita, riga 14572, è codice morto shadowato dall'override.)*

| Invariante | Prima | Dopo il fix |
|---|---|---|
| Preventivo → `convert` → preventivo `confermato` + ordine creato in `production` | ✅ | ✅ |
| **Totale ordine** da preventivo reale (`grossPrice`) | ❌ `total=0` | ✅ `total=260` |
| **Importo vendita** da ordine completato | ❌ `amount=0` | ✅ `amount=260` |
| Ricavo visibile ai KPI (somma vendite `pagato`) | ❌ **€0 sempre** | ✅ corretto (es. €380) |

**Causa (frammentazione nomi campo):** il preventivo reale (`Quoter.saveQuote`) salva il totale come **`grossPrice`** (netto come `netPrice`). Ma il patch `OrderFlow.createFromQuote` (riga 67937) leggeva `quote.grand||quote.total||0` — **nessuno dei due esiste** su un preventivo reale → ogni ordine di produzione nasceva con `total=0`. A valle `AutoEngine.createSaleFromOrder` leggeva `order.total||0` → **ogni vendita registrava €0**, azzerando ricavi e KPI.

**Fix (minimale, non distruttivo, nessun cambio di logica — solo lettura dal campo che contiene davvero il valore):**
- `createFromQuote` (67937): `total: quote.grand||quote.grossPrice||quote.total||0`; idem `subtotal` da `netPrice`; `tax` derivata se assente.
- `createSaleFromOrder` (11253): `amount: order.total||order.value||order.grossPrice||order.amount||0` — tollerante alle due forme d'ordine coesistenti (`OrderFlow`=`total`, `toOrder`=`value`).

Verificato end-to-end con la forma reale del preventivo e con entrambi i creatori di ordini. `verify-syntax`: 138 blocchi, 0 errori.

### GATE 4 — Incassi (vendita `da_pagare → pagato`)
`Sales.markPaid(id)`:
| Invariante | Esito |
|---|---|
| `status → 'pagato'` + `paidAt` valorizzato | ✅ |
| Persistenza su `sales` | ✅ |
| Entrata `cashflow` auto (toggle `s5b_auto_cashflow`, default-OFF) con importo corretto | ✅ (€150) |

### GATE 4/6 — Fattura da Ordine (FatturaPA XML) 🔴 2 BUG CORRETTI
`FatturaDaOrdine.genera(ordine)`:
| Prova | Prima | Dopo il fix |
|---|---|---|
| Generazione fattura | ❌ **crash** `PrimaNota.register is not a function` | ✅ genera e scarica |
| XML valido con nome cliente `"Rossi & Figli <S.r.l.>"` | ❌ XML **malformato** (SDI lo rifiuta) | ✅ XML well-formed (DOMParser OK) |
| Imponibile scorporato da `total` (ora corretto) | — | ✅ €122 → €100 imponibile @22% |

**Bug 1 — `PrimaNota.register` mancante (crash fattura).** Esistevano **due** `PrimaNota`: un
`const` ricco (`getEntries/render/exportCSV`, riga 58960) e un secondo oggetto `window.PrimaNota`
(`register/load/save`, riga 78184) che si **clobberavano** a vicenda. I riferimenti nudi
(`FatturaDaOrdine.genera` → `PrimaNota.register`) risolvevano al `const`, privo di `register` →
crash a runtime (fattura salvata in SDI ma **nessun download** e **nessuna registrazione in prima
nota**). Fix non distruttivo: **merge** delle due API con `Object.assign(PrimaNota, {...})` →
un solo oggetto completo, nessun metodo perso (verificato: `register`, `exportCSV`, `render`
tutti presenti, `window.PrimaNota === PrimaNota`).

**Bug 2 — FatturaPA senza escape XML.** `brand.name`, `ordine.client`, `ordine.description`
entravano **grezzi** nell'XML → un nome con `&`/`<`/`>`/`"`/`'` produceva una fattura elettronica
non valida, rifiutata dal Sistema di Interscambio. Fix: helper `xmlEsc()` applicato ai tre campi
(richiesto dalle `security-rules`: sanitizzare prima del markup).

### GATE 5 — Magazzino (`Inventory.adjust`)
| Invariante | Esito |
|---|---|
| Carico `+5` → stock aggiornato, delta corretto | ✅ |
| Scarico oltre giacenza (`−1000`) → **clamp a 0**, nessun negativo | ✅ |
| Persistenza su `inventory` | ✅ |

### GATE 5 — Acquisti/Fornitori (PO → ricezione → carico magazzino)
`SuppliersManager.receivePO(id)`:
| Invariante | Esito |
|---|---|
| PO → `status:'ricevuto'` + `receivedAt` | ✅ |
| Carico magazzino: stock `+qty` per ogni riga (via `itemId`) + `logMove` | ✅ (+10 verificato) |
| Persistenza su `inventory` | ✅ |
| **Idempotenza**: seconda ricezione non raddoppia il carico | ✅ **guardia aggiunta** (`if status==='ricevuto' return`) — doppia chiamata = carico singolo (+7, non +14) |

**Irrobustimento (non distruttivo):** `receivePO` non aveva guardia di idempotenza — una
seconda chiamata programmatica avrebbe **raddoppiato** le giacenze (l'UI nasconde il bottone, ma
non è una difesa sui dati). Aggiunta guardia coerente col pattern dedup già usato in
`QuoterBridge.toOrder`. Il magazzino è dato critico: carico esattamente una volta.

### GATE 6 — Costing & margine commessa 🔴 BUG PERDITA DATI CORRETTO
`RealCostEngine` + aggregazione `BDW.realCostByOrder`:
| Prova | Prima | Dopo il fix |
|---|---|---|
| 3 costi loggati sullo stesso ordine (rapidi) | ❌ **1 solo persistito** (sum 10) | ✅ 3 persistiti, id distinti, sum 60 |
| `getByOrder` / somma costi reali | ❌ sottostimata | ✅ corretta |
| Margine reale commessa (`getRealMarginForSale`, ricavo 200) | ❌ **90% gonfiato** | ✅ **70%** corretto `(200−60)/200` |

**Bug — collisione id in `logCost` (perdita costo → margine gonfiato).** `logCost` usava
`id: Date.now()`: due costi registrati nello stesso millisecondo (batch, click rapidi, percorso
programmatico) collidevano sull'id e il secondo `IDB.put` **sovrascriveva** il primo → costo reale
sottostimato e **margine commessa artificialmente alto** (una BI fuorviante su un numero di
business critico). Fix: lo store `cost_entries` ha `autoIncrement` su `id` → ometto l'id e lascio
che il DB ne assegni uno univoco (impossibile collidere). Verificato: 3 costi → 3 record distinti,
margine reale corretto.

### GATE 0/7 — Backup & Restore 🔴 TRAPPOLA PERDITA DATI CORRETTA
Esistono due sistemi di backup:
1. **Snapshot su store `backups`** (`_createSnapshot`/`restore`, riga ~41735): usa `IDB.exportAll()`
   su **tutti** gli store, restore **atomico** con validazione e conferma. ✅ corretto (è il backup reale).
2. **`InglyCloudSync.exportJSON`/`importJSON`** (riga ~70714): etichettato *"Esporta Backup JSON —
   Salva tutti i dati in locale"*.

| Prova | Prima | Dopo il fix |
|---|---|---|
| Export "tutti i dati" include IndexedDB (clienti/vendite/ordini/magazzino) | ❌ **solo 9 chiavi localStorage** | ✅ **62 store IDB + localStorage** |
| Round-trip: export → perdita dati → import → dati tornano | ❌ dati IDB persi per sempre | ✅ ripristinati (merge per `id`) |

**Bug — backup "completo" che ometteva IndexedDB.** `collectAllData()` salvava solo
`SYNC_STORES` (9 chiavi localStorage); il commento prometteva «include IDB critical stores» ma
non lo faceva. Un utente che si fida di quel backup e ripristina su installazione pulita avrebbe
perso **tutti** i dati core (viola il principio #1 «nessuna perdita dati»). Fix: `exportJSON` ora
allega `IDB.exportAll()` (esclude `backups`, no ricorsione); `importJSON` ripristina anche gli
store IDB (merge per chiave `id`, guardato per-store, non cancella nulla). Round-trip verificato.

## Da verificare nei prossimi giri
- BOM/distinta materiali e **consumo stock su conferma ordine di produzione** (MRP, quando presente).
- Multi-viewport e accessibilità (GATE 2).
- **Codice morto da bonificare (candidato):** `QuoterBridge.convert` riga 14572 (crea vendita) è shadowato dall'override riga 26116; due forme d'ordine coesistono (`total` vs `value`) — valutare unificazione campo totale a livello di modello (GATE 1/DB).
- Magazzino: carico/scarico, scorte, riordino, invarianti quantità (GATE 5).
- Acquisti/Fornitori: RFQ → PO → ricezione (GATE 5).
- Produzione/costing per tecnologia (GATE 6).
- Multi-viewport e accessibilità (GATE 2).

> Nota ambiente: gli screenshot dell'app completa non sono producibili in questa sessione (il renderer headless va in crash per il peso del file ~8MB); le verifiche funzionali sono fatte via misure DOM e stato IndexedDB, non visivamente.
