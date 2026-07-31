---
name: analytics-engine
description: "Analizza metriche di performance commerciale di INGLY DESIGN (CTR, conversioni, vendite per categoria, comportamento utenti, bounce, tempo sul sito) e propone miglioramenti. Usa questa skill quando l'utente porta dati di traffico/vendite da analizzare o chiede quali categorie/prodotti valorizzare."
---

# Analytics Engine

## Stato reale del progetto
Verifica sempre in `assets/js/` e `docs/ARCHITECTURE.md` se esiste già un sistema di analytics collegato (es. GA4, Plausible) prima di assumerne uno: il sito è statico, quindi qualunque analytics richiede uno script terzo incluso esplicitamente, non è "gratis" per default. Se non trovi nulla, dillo chiaramente invece di inventare dati.

## Cosa puoi fare senza dati esterni
Analisi strutturale del catalogo usando `data/products.json`/`data/categories.json` come proxy (non sostituto) dei dati reali di vendita:
- Distribuzione prodotti per categoria/materiale (categorie sovra/sotto-rappresentate rispetto al posizionamento del brand).
- Coerenza tra `heroFeatured` (`data/config.json`) e i prodotti con più recensioni (`rev`) o tag "Best" (`coll`/`tag`), se questi campi sono usati come proxy di popolarità.
- Copertura bilingue (IT/EN) di testi e prodotti.

## Quando l'utente fornisce dati reali (export, screenshot, numeri)
Analizzali direttamente con metodo standard (funnel, CTR per sezione, categorie a maggior conversione) e collega sempre le conclusioni ad azioni concrete nel progetto reale: quali prodotti promuovere in `heroFeatured`, quali categorie dare più risalto (`big` in `categories.json`), quali contenuti rivedere con `campaign-manager`/`brand-guardian`.

## Non fare
Non inventare percentuali, numeri di traffico o conversioni non forniti dall'utente e non presenti nei dati reali del progetto.
