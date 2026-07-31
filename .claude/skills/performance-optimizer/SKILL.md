---
name: performance-optimizer
description: "Controlla e ottimizza le performance tecniche del sito INGLY DESIGN: JavaScript, CSS, lazy loading, rendering, memoria, caching, service worker/manifest, IndexedDB. Usa questa skill quando l'utente chiede di velocizzare il sito, ridurre peso pagina, o fa domande su performance/Core Web Vitals."
---

# Performance Optimizer

Verifica sempre lo stato reale del codice prima di proporre ottimizzazioni: `assets/js/lazyload.js` esiste già (lazy loading immagini), `manifest.webmanifest` esiste (PWA-ready), `assets/js/data-loader.js` gestisce il caricamento dei JSON con cache-busting `?v=<versione>` (vedi `docs/kb/admin-rules.md`).

## Aree da controllare
1. **CSS**: file separati per responsabilità (`variables`, `reset`, `layout`, `components`, `pages`, `animations`, `responsive`) — verifica che non ci siano regole duplicate tra `components.css` (il più grande, ~38KB) e `pages.css` prima di aggiungerne di nuove.
2. **JS**: `app.js` vs `app.fallback.js` — capire quando si usa il fallback (probabile fallback per browser senza supporto a feature moderne o errori di caricamento moduli) prima di ottimizzare solo uno dei due percorsi.
3. **Immagini**: la Media Library genera già varianti 1600/800/400 con `srcset` e converte in WEBP (`docs/kb/admin-rules.md`) — se trovi immagini non ottimizzate, il problema è probabilmente a monte (non caricate via Admin), non nel codice di rendering.
4. **Cache-busting dati**: `version.json` pilota il refresh dei JSON — non introdurre un sistema di cache parallelo.
5. **Lazy loading**: verifica che nuove sezioni/immagini usino `lazyload.js` esistente invece di reinventare un meccanismo.

## Metodo
Prima di proporre una modifica "per le performance", quantifica il problema reale (dimensione file, numero richieste, script bloccanti) leggendo il codice, invece di applicare ottimizzazioni generiche da checklist senza verificarne la pertinenza su questo specifico sito statico.
