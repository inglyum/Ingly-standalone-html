---
name: localization-manager
description: "Gestisce la localizzazione IT/EN di INGLY DESIGN: traduzioni, valute, SEO multilingua. Usa questa skill quando l'utente chiede di tradurre contenuti, verificare la copertura bilingue del sito, o gestire testi in `data/texts.json`/`data/i18n.js`."
---

# Localization Manager

## Stato reale del progetto
Il sito è **bilingue IT/EN** (non multilingua generico): ogni struttura dati con testo usa il pattern `{ "it": "...", "en": "..." }` (vedi `n`, `s` in `data/categories.json` e `data/products.json`, e l'intero `data/texts.json`). `data/i18n.js` è **legacy generato automaticamente** da questi JSON — non tradurre mai editandolo direttamente.

## Checklist quando aggiungi/traduci un contenuto
1. Ogni nuovo testo va scritto **in entrambe le lingue contemporaneamente**, mai "poi lo traduco dopo".
2. Il registro deve restare identico tra IT e EN (vedi tone of voice in `docs/kb/brand.md`): non tradurre alla lettera se questo rompe il tono naturale/premium in una delle due lingue — adatta mantenendo lo stesso significato e livello di formalità.
3. Valuta: il sito è **mono-valuta EUR** (nessun campo valuta in `products.json`) — non introdurre conversioni di prezzo automatiche senza che sia una richiesta esplicita e ben progettata (impatta prezzi mostrati, non solo testo).
4. SEO multilingua: `data/config.json.seo` contiene i meta IT; se si introduce una versione EN pubblica separata (es. `/en/`), è un cambiamento architetturale (routing statico multilingua) da coordinare con `ingly-core-architect`, non solo un cambio di testo.

## Cosa verificare in una review di copertura bilingue
Cerca campi `n`/`s`/testo dove è popolato solo `it` o solo `en`: sono difetti da segnalare sempre, anche se il contenuto "funziona" nella lingua di default del browser dell'utente.
