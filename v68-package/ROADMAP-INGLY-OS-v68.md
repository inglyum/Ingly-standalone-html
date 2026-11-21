# INGLY OS — Roadmap operativa da v68 a versione di produzione

**Data di riferimento:** 21 novembre 2026  
**Prodotto:** INGLY DESIGN / INGLY OS (laboratorio di personalizzazione: laser CO₂, diodo, IR, stampa UV, stampa 3D e lavorazioni B2B).  
**Base reale:** v67 Export & Restore → candidata v68 Documenti & Roadmap.  
**Stato attuale:** **QA CANDIDATE — NON USARE ANCORA PER PRODUZIONE**.

> Questa roadmap distingue funzionalità presenti nel file, verifiche realmente eseguite e attività pianificate. La presenza di un modulo nella navigazione non costituisce prova che tutte le operazioni del modulo siano corrette.

## 1. Quadro sintetico e stato reale

| Area | Stato v68 | Evidenza o limite |
|---|---|---|
| Interfaccia e navigazione | **Verificata in v65, regressione v68 aperta** | In v65 testate 115 viste standard, responsive 320–1440 px; serve ripetizione sulla v68 completa |
| Backup e ripristino | **Corretto logicamente v66–v67, test DB reale aperto** | Simulazione di rollback atomico, file JSON e ZIP reali; browser reale IndexedDB non certificato per v68 |
| ZIP portatile | **Verificato su v67, mantenuto in v68** | JSZip 3.10.1 incorporato; contiene HTML e dati quando selezionati; non cifrato |
| Excel: esportazione | **Implementata e verificata in v68** | Fallback OpenXML offline con XLSX reale aperto via openpyxl; più fogli, numeri, 0, accenti e celle testuali |
| Excel: importazione | **Parziale / aperta** | Dipende da SheetJS online; il fallback offline rifiuta esplicitamente l'import |
| PDF vendite | **Stampa di emergenza disponibile** | Quando jsPDF manca, anteprima stampabile con marcatura BOZZA NON FISCALE; non sostituisce documenti SDI |
| PDF complessi, fatture e report | **Da certificare** | jsPDF e AutoTable ancora da CDN; test con biblioteca reale e verifica contenuti mancanti |
| Dashboard/grafici | **Da verificare v68** | Chart.js da CDN; assenza libreria identificata nella diagnostica |
| CRM, preventivi, ordini, magazzino, finanza | **Moduli presenti; test funzionali parziali pregressi** | CRUD di prova in v65; serve suite end-to-end v68 per ogni flusso |
| Google Drive, OAuth e sincronizzazione | **Non certificato** | Nessun accesso OAuth su account di prova, permessi e risoluzione conflitti da validare |
| SaaS multiutente | **Non disponibile come backend professionale** | HTML + IndexedDB e chiavi nel browser non equivalgono a server con RBAC/tenant isolation |

## 2. Ordine di esecuzione e gate (non saltare le dipendenze)

### GATE 0 — Sicurezza dati e ambiente QA (P0, blocca rilascio)

- [ ] Salvare copia del gestionale operativo e **backup indipendente**, verificato aprendone contenuto e dimensione.
- [ ] Creare due profili browser separati: A per generazione, B per ripristino; mai usare dati clienti reali nei test.
- [ ] Eseguire backup JSON e ZIP con immagini grandi (oltre 150 kB) e confrontare conteggi, record, immagini e hash.
- [ ] Testare ripristino IndexedDB reale, riavvio, rollback con errore deliberato, backup parziale e dati corrotti.
- [ ] Verificare comportamento su origine `file://` e tramite server locale `http://localhost`, documentando la differenza di accesso ai dati.
- [ ] Definire recupero dati, backup off-site cifrato, retention, autorizzazioni e procedura di emergenza.

**Criterio PASS:** 100% dei record attesi ritrovati, 0 record mancanti, 0 modifiche dopo import rifiutato, ripristino atomico verificato sul motore IndexedDB reale.

### GATE 1 — Documenti, PDF ed Excel (P0/P1)

- [x] Esportazione XLSX offline di base: vera struttura OpenXML con più fogli, celle numeriche, `0`, Unicode, celle testuali sicure (v68).
- [x] Anteprima stampabile di vendita senza jsPDF, chiaramente marcata come bozza non fiscale (v68).
- [x] Diagnostica nell'area Impostazioni: disponibilità ZIP, Excel export/import, PDF, grafici, html2canvas, API IndexedDB (v68).
- [ ] Testare esportazioni XLSX **reali** dai moduli Vendite, Catalogo, Magazzino, Cashflow, Attrezzature e Generale (non soltanto fogli sintetici).
- [ ] Supportare importazione XLSX offline o fornire import CSV robusto e mappatura colonne assistita; test su file grandi e non validi.
- [ ] Incorporare librerie PDF/Chart/Excel con verifica licenza, integrità e versioni, oppure consolidare un'alternativa equivalente.
- [ ] Validare PDF clienti, listini, etichette, report, preventivi e ricevute; evitare numerazioni automatiche non idempotenti.
- [ ] Separare **bozza gestionale** da documentazione fiscale; verificare regime IVA/forfettario/bollo/SDI con professionista e provider accreditato.

**Criterio PASS:** ogni documento si apre, si ristampa e riporta importi e dati corretti; XLSX import/export con round-trip documentato; nessun bottone produce file vuoto o silenziosamente non valido.

### GATE 2 — Regressione completa UI e funzioni (P0)

- [ ] Ripetere tutte le **115 schermate** sulla v68, verificando non solo apertura ma almeno un'azione rappresentativa per ciascun gruppo.
- [ ] Testare 320, 360, 390, 768, 1024, 1440 e 1920 px; sidebar, modali, filtri, griglie, toast, zoom al 125–150%.
- [ ] Registrare e correggere gli errori console, gli errori `promise rejection`, navigazione e click non funzionanti.
- [ ] Testare focus tastiera, etichette accessibili, contrasto chiaro/scuro e navigazione senza mouse.
- [ ] Eseguire workflow `Lead → Preventivo → Ordine → Produzione → Vendita → Pagamento` con dati sintetici tracciati.
- [ ] Verificare cancellazione, ricerca, modifica, duplicazione, filtri, date, valute, import/export e dati dopo reload.

**Criterio PASS:** 0 P0/P1 aperti, nessuna perdita dati, 100% dei test smoke critici passati su Chrome ed Edge; Safari e Firefox nella matrice compatibilità.

### GATE 3 — Modello ERP canonico e integrità (P1, prima delle nuove feature)

- [ ] Censire schema attuale `InglyMasterDB` v31: store, chiavi, indici, duplicazioni, consumer e adapter legacy.
- [ ] Stabilizzare `partners` canonici con ruoli cliente/fornitore, collegati a CRM lead e opportunità, senza cancellare prematuramente gli store legacy.
- [ ] Formalizzare vincoli e stati per preventivi, ordini, pipeline, consegne, vendite, incassi e note contabili.
- [ ] Centralizzare CRUD, eventi e validazioni; scritture tra store in transazioni atomiche e idempotenti.
- [ ] Definire migrazioni sequenziali con dry-run, rollback e audit; no cancellazioni automatiche in caso di versioni superiori.
- [ ] Creare test referenziali contro ordini orfani, clienti duplicati, importazioni parziali e record incoerenti.

**Criterio PASS:** nessun record orfano, migrazione ripetibile e reversibile con dati anonimi; record v67 leggibili anche dopo aggiornamento.

### GATE 4 — CRM, vendite e listini B2B (P1)

- [ ] CRM: clienti/fornitori, tag, segmenti, consenso contatto, storico attività, promemoria e follow-up.
- [ ] Pipeline commerciale distinta da pipeline produzione, con valore probabilistico e attività assegnate.
- [ ] Preventivi versionati, con materiali, tecnologia, personalizzazioni, sconti e scadenza.
- [ ] Conversione `preventivo → ordine` senza duplicare o perdere righe; collegamento pagamento/stato.
- [ ] Catalogo B2B: varianti, materiali, colori, MOQ, prezzi per quantità e canale; configurazioni per stampa UV, CO₂, IR, diodo, stampa 3D.

**Criterio PASS:** un cliente di prova attraversa l'intero funnel e tutti gli importi rimangono coerenti nei moduli.

### GATE 5 — Magazzino, acquisti e fornitori (P1)

- [ ] Unificare materiali e articoli con SKU, unità, ubicazioni e valorizzazione stock.
- [ ] Gestire carico/scarico, riserve per commessa, scorte minime, riordino, inventario fisico e rettifiche auditabili.
- [ ] Gestire RFQ, confronti fornitori, ordini di acquisto, ricezioni parziali, costo trasporto e lead time.
- [ ] Collegare consumi reali da ordini di produzione e registrare scarti/riutilizzi.

**Criterio PASS:** invarianti quantità (stock + riserve + movimenti) riconciliate; nessuno scarico doppio.

### GATE 6 — Produzione laser/UV/3D e costing (P1)

- [ ] Distinta base revisionata: materia prima, spessore, dimensione pannello, sfrido, supporto, vernice, finitura e imballaggio.
- [ ] Cicli per macchina (xTool CO₂, diodo, IR, stampa UV, stampa 3D) con tempi di setup, lavorazione e manodopera.
- [ ] Audit matematico comune di `LaserCalcV2`, `CalcMacchine`, `Print3DQuoter`, `RealCostEngine`, `PricingEngine`.
- [ ] Costing: materiali + tempo macchina + ammortamento + energia + consumabili + scarti + labor + spese + IVA applicabile.
- [ ] Ordine di produzione, pianificazione capacità, checklist operatore, file di lavorazione, QC e consuntivo.
- [ ] Traceability: associazione di parametri e file SVG/DXF/PNG a versioni prodotto, con backup e privacy.

**Criterio PASS:** preventivo e consuntivo riconciliati su 10 commesse campione di tecnologie diverse, con tolleranze documentate.

### GATE 7 — Finanza, fiscale e reporting (P1)

- [ ] Prima nota, crediti/debiti, cashflow previsto/effettivo, riconciliazione di pagamenti.
- [ ] Margine e profittabilità per prodotto, commessa, macchina, canale e cliente.
- [ ] Documentazione fiscale italiana: identificare obblighi applicabili, fattura elettronica/SDI, esiti, numerazione, archiviazione e controlli professionali.
- [ ] Report mensili e dashboard con grafici accessibili anche se CDN assente (fallback testuale).
- [ ] Export commercialista in formato concordato (non presumere conformità SDI di un semplice PDF).

**Criterio PASS:** importi e arrotondamenti verificati su casi forfettario/ordinario pertinenti; quadratura incassi e documenti.

### GATE 8 — Cloud sicuro e multiutente (P2, architettura separata)

- [ ] Definire API server, database remoto, tenant isolation, MFA e ruoli enforcement **server-side**.
- [ ] Autenticazione e segreti solo server-side; rimuovere password/API key da HTML/IndexedDB.
- [ ] Sync offline-first con versioni, conflitti, retry, idempotenza e monitoraggio.
- [ ] Backup server cifrati, export GDPR, audit log, retention, permessi e test recupero.
- [ ] CI/CD, ambiente staging/produzione, feature flags, osservabilità e suite automatica continua.

**Criterio PASS:** penetration test, tenant-isolation test, restore server, rollback deployment e auditing dei permessi.

## 3. Priorità concrete per la prossima iterazione

| Ordine | Attività | Perché | Evidenza richiesta |
|---:|---|---|---|
| 1 | Ripristino vero su due profili browser | Protezione dati | Report confronto record + hash e rollback |
| 2 | PDF e fatturazione con librerie reali | Flusso vendita bloccato offline | PDF generati, ispezionati e validati |
| 3 | XLSX modulo-per-modulo e import | Verificare XLSX non solo sintetico | Round-trip da file reali di prova |
| 4 | 115 navigazioni + smoke CRUD v68 | Evitare regressioni v67→v68 | Screenshot + log per viewport |
| 5 | Catalogo → Quoter → Ordini → Produzione | Cuore business INGLY | Dati campione end-to-end |
| 6 | Audit schema e transazioni inter-modulo | Prevenire dati fantasma | Test di idempotenza e invarianti |
| 7 | Produzione/costi per tecnologia | Prezzi e marginalità affidabili | 10 casi di costo riconciliati |
| 8 | Cloud, sicurezza e SDI | Precondizione SaaS / fiscale | Test provider, accessi e compliance |

## 4. Definition of Done (obbligatoria)

Ogni modulo passa a **APPROVATO** solo se: (1) esistono dati e schema documentati; (2) tutte le azioni sono collegate a handler reali; (3) validazioni e messaggi d'errore sono chiari; (4) CRUD e rollback sono verificati; (5) permessi e privacy sono valutati; (6) il layout è testato in 6+ viewport; (7) il modulo funziona dopo reload; (8) i test sono ripetibili; (9) sono censite dipendenze esterne e limiti offline; (10) la documentazione è coerente col codice consegnato.

## 5. Piano di adozione, da seguire sulla tua macchina

1. Estrarre l'intero pacchetto v68 in una cartella dedicata e tenere intatti v67 e il file operativo.
2. Leggere `README-RELEASE.md` e `QA-REPORT.md` prima di aprire la candidata.
3. Utilizzare un **nuovo profilo Chrome/Edge** e dati di prova fittizi; non ripristinare subito il backup aziendale.
4. Aprire **Impostazioni → Verifica PDF / Excel / ZIP**: registrare quali librerie sono disponibili e quali no.
5. Provare export `.xlsx` da Vendite e Catalogo, quindi verificare che il file si apra e contenga gli importi attesi.
6. Provare il flusso Vendita → documento; se il PDF avanzato non è disponibile, usare solo la **bozza di stampa non fiscale**.
7. Testare export/restore su secondo profilo e documentare conteggi e immagini; **non cancellare l'archivio originale**.
8. Registrare difetti con nome schermata, azione, risultato atteso, risultato ottenuto, browser e screenshot.
9. Promuovere la build soltanto dopo i gate 0–2 e l'approvazione delle verifiche contabili/fiscali pertinenti.

## 6. Rischi e avvertenze

- I backup locali JSON/ZIP **non sono cifrati**. Possono contenere nominativi, email, impostazioni e fotografie: custodirli in storage protetto e non condividerli pubblicamente.
- La persistenza browser dipende dal profilo e dall'origine. Aprire il gestionale da un percorso o URL diverso può mostrare un archivio separato.
- La disponibilità di `window.indexedDB` non è una prova di scrittura/ripristino corretto.
- Una stampa HTML salvata come PDF **non è una fattura elettronica** né una verifica degli adempimenti fiscali.
- La v68 migliora il fallback XLSX **di esportazione**, non importa ancora `.xlsx` senza librerie originali.
- La v68 non è un ERP multiutente con backend sicuro. Per quello è necessario Gate 8.

---

**Release target:** candidata v68 = stabilità delle esportazioni e trasparenza diagnostica. **Release di produzione:** sospesa fino a superamento documentato dei gate P0.  
**Responsabilità consigliate:** product owner INGLY per accettazione funzionale; sviluppatore/QA per test; commercialista per aspetti fiscali; responsabile sicurezza per cloud/privacy.
