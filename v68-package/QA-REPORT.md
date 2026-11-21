# INGLY OS v68 — Rapporto tecnico QA

**Data:** 21 novembre 2026  
**Base:** v67 Export & Restore → v68 Documenti & Roadmap  
**Stato:** **CANDIDATA QA — NON CERTIFICATA PER PRODUZIONE**

## Modifiche implementate nella v68

1. **XLSX offline:** aggiunta una compatibilità OpenXML a valle della libreria JSZip 3.10.1 già incorporata nel file. Opera soltanto quando SheetJS non è disponibile. Consente le API di base `aoa_to_sheet`, `json_to_sheet`, `table_to_sheet`, `book_new`, `book_append_sheet`, `write` e `writeFile`. Scrive XLSX veri con celle numeriche, testuali, booleani, fogli multipli, larghezza colonne e filtri. Le stringhe che cominciano con `=` sono esportate come testo, non come formule.
2. **Catalogo ZIP:** corretto l'utilizzo di `XLSX.write` per supportare la generazione asincrona della compatibilità offline (e il normale ritorno sincrono di SheetJS).
3. **Vendite PDF offline:** quando jsPDF manca, `Sales.downloadPDF` apre una stampa A4 in bozza, con avvertenza **non fiscale**. Si può stampare o usare "Salva come PDF" dal browser. Quando jsPDF è disponibile, rimane la logica originale. Non si altera il record di vendita.
4. **PDF report mensile:** introdotto errore guidato invece di `TypeError` quando jsPDF manca; il report mensile offline resta non disponibile.
5. **Diagnostica nella pagina Impostazioni:** pulsante "Verifica PDF / Excel / ZIP" con stato osservabile di JSZip, Excel export/import, PDF, Chart.js, html2canvas, IndexedDB API e cloud. Non esegue scritture e non accede a dati reali.
6. **Consolidamento documentazione:** roadmap operativa stampabile, README per test in profilo isolato, suite QA nuova e risultati.

**Non è stata eseguita alcuna migrazione IndexedDB:** il sorgente conserva `InglyMasterDB`, versione **31**. I moduli applicativi v67 restano presenti.

## Test effettivamente eseguiti sulla v68

| Prova | Risultato | Tipo di evidenza |
|---|---|---|
| Sintassi JavaScript di tutte le unità inline non vuote | **130/130 PASS** | Node.js `--check` |
| CSS stylesheet | **18 blocchi; 0 errori di parsing** | tinycss2 |
| ID HTML | **0 duplicati su 1.285 ID** | BeautifulSoup |
| Schema DB rispetto a v67 | **v31 invariato** | Verifica struttura/costante |
| ZIP XLSX OpenXML con due fogli | **PASS** | JSZip reale, Node.js |
| Apertura XLSX scritto offline | **PASS** | `openpyxl`; zeri, accenti, numeri, booleane, formule come stringa |
| Download `.xlsx` da click in Chromium | **PASS** | Browser reale (pagina di test controllata), download file e rilettura con `openpyxl` |
| Diagnostica librerie | **PASS** | Chromium, apertura/chiusura dialog |
| Stampa vendite offline | **PASS limitato alla preview** | Chromium, zero numerico e escaping XSS; non verifica stampa fisica né conformità fiscale |
| Errori JavaScript non gestiti nei due test browser controllati | **0 rilevati** | Playwright |
| Esportazione ZIP del pacchetto di consegna | **PASS** | ZIP creato e riaperto con verifica integrità file |

### Test precedenti mantenuti come baseline — NON ripetuti integralmente nella v68

- Su **v65** erano state riportate 115/115 aperture viste e CRUD di prova. Non sono prove di runtime end-to-end della v68.
- Su **v66–v67** erano passati test di backup/ripristino simulati e un test JSZip reale. Nessuna operazione Google Drive o rollback IndexedDB **reale** è stata certificata qui.

## Limitazioni e rischi residui (nessun falso PASS)

- **Importazione XLSX offline NON implementata** nella v68. Il fallback segnala esplicitamente che serve SheetJS o conversione in CSV. Le importazioni in XLS del vecchio codice richiedono la libreria originale.
- **PDF avanzati NON incorporati**: jsPDF, AutoTable e html2canvas sono ancora da CDN; possono fallire offline. La preview di Vendite è una **bozza**, non una fattura elettronica o ricevuta fiscale.
- **Grafici Chart.js** ancora da CDN; non certificati quando offline.
- **Full browser run e IndexedDB reale**: ambiente Chromium di questa sessione blocca `file://`, `http://localhost` e `data:` nella navigazione. I test browser v68 sono stati eseguiti su pagine minime create da `page.set_content`, non aprendo l'intero ERP.
- **Moduli CRM/Magazzino/Vendite/Produzione**: non ripetuta la suite completa end-to-end sulla v68.
- **OAuth e Google Drive**, API terze, fatturazione italiana e integrazioni hardware non testate con account/dispositivi reali.
- **Compatibilità fisica**: non testati Edge/Firefox/Safari né schermi/device reali con dati di produzione.
- **Sicurezza**: file HTML standalone + IndexedDB non offre autenticazione e isolamento server-side. ZIP/JSON non sono cifrati.
- **Fatturazione**: gli importi e le regole fiscale/SDI devono essere verificati con un professionista prima di emettere documenti.

## Riproducibilità della suite v68

Dalla cartella del pacchetto (Node.js e Python, con pacchetti Playwright, Chromium e openpyxl):

```bash
python tests/QA-STATIC.py
node tests/QA-XLSX-OFFLINE.js
python tests/QA-DIAGNOSTICS-BROWSER.py
python tests/QA-XLSX-DOWNLOAD.py
```

- `QA-STATIC.json`: hash SHA-256 esatto, conteggi e sorgenti esterne.
- `tests/xlsx-offline-sample.xlsx`: file demo generato dal test Node.
- `tests/qa-browser-download.xlsx`: file generato durante il download reale del browser.
- `tests/qa-diagnostics-mobile.png`, `tests/qa-print-mobile.png`: schermate dei test browser controllati.
- `ROADMAP-INGLY-OS-v68.md` / `.html`: gate di lavoro e criteri di uscita.

**Decisione:** v68 è il **file HTML completo aggiornato e la roadmap completa**, NON un ERP con tutte le funzioni certificate. Non sostituire il gestionale attivo fino a PASS documentato di Gate 0–2.
