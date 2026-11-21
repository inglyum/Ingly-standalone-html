# INGLY OS v68 — Pacchetto completo e roadmap

**Stato: CANDIDATA QA — non ancora release di produzione**  
Base: v67 Export & Restore | Database: `InglyMasterDB` v31, invariato.

## Aprire in sicurezza

1. Conserva **l'HTML operativo precedente** e un backup indipendente dei tuoi dati; non sovrascrivere l'originale.
2. Estrai questo ZIP interamente in una nuova cartella.
3. Apri `INGLY-OS-v68-COMPLETE-QA.html` in un profilo Chrome/Edge **di prova**, non nello stesso profilo del gestionale aziendale.
4. Configura un'azienda fittizia; prova Clienti, Catalogo, Preventivi, Ordini e Vendite con record temporanei.
5. Vai in **Impostazioni → Verifica PDF / Excel / ZIP**: il popup indica quali librerie sono caricate. Puoi esportare `.xlsx` di base anche senza connessione grazie a JSZip incorporato.
6. Se jsPDF non si carica, il comando documento della sezione Vendite apre una **bozza stampabile**. Non trattarla come fattura fiscale.
7. Verifica backup e ripristino **su un secondo profilo di test**; mai sul database aziendale senza backup esterno.
8. Leggi `ROADMAP-INGLY-OS-v68.html` per l'ordine dei lavori, i gate e le condizioni di rilascio. Si può stampare dal browser.

## Contenuto del pacchetto

- `INGLY-OS-v68-COMPLETE-QA.html` — HTML completo del gestionale, con aggiunte v68.
- `ROADMAP-INGLY-OS-v68.html` — roadmap visuale/ stampabile.
- `ROADMAP-INGLY-OS-v68.md` — roadmap modificabile.
- `QA-REPORT.md` e `QA-STATIC.json` — risultati e limiti verificati.
- `INGLY-v68-OFFLINE-XLSX.js`, `INGLY-v68-DOCUMENTS-DIAGNOSTICS.js` — sorgenti delle patch, **già incorporate** nell'HTML completo; non serve caricarli separatamente.
- `tests/` — suite di verifica, XLSX prodotti e screenshot.
- `JSZIP-LICENSE.md` — licenza della libreria ZIP incorporata.
- `build-v68.py` — script riproducibile **solo se** disponibile anche il sorgente v67 nel percorso indicato nello script.

## Cosa funziona in offline e cosa no

| Funzione | Stato |
|---|---|
| ZIP portatile | Libreria JSZip inclusa; real-world app export non testato integralmente su v68 |
| Export XLSX | Fallback offline verificato su dati campione, file aperti da Excel-compatible reader |
| Import XLSX | Richiede SheetJS esterno; alternativa CSV |
| Documento Vendite senza jsPDF | Bozza HTML stampabile (non fiscale) |
| Fatture/PDF avanzati | Richiedono jsPDF e altre librerie esterne, non certificati offline |
| Grafici | Chart.js esterno, non garantito offline |
| Google Drive e cloud | Richiedono autorizzazioni e test separati |

**Riservatezza:** JSON e ZIP non sono cifrati e possono contenere dati personali. Non inoltrare gli archivi reali a terzi o in spazi pubblici.

**Prima della produzione:** Gate 0 (backup/restore reale), Gate 1 (documenti ed Excel end-to-end), Gate 2 (regressione UI completa) superati e firmati nel rapporto QA.
