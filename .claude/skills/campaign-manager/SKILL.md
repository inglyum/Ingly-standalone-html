---
name: campaign-manager
description: "Gestisce campagne marketing di INGLY DESIGN: Black Friday, Summer Sale, promozioni, lancio nuove collezioni, landing page, banner, CTA. Usa questa skill quando l'utente chiede di pianificare o costruire una campagna promozionale, un banner con scadenza, una landing dedicata a un evento di vendita."
---

# Campaign Manager

Leggi `docs/kb/brand.md` (tono di voce, dati reali del brand) e `docs/kb/ecommerce-rules.md` (come sono strutturati prodotti/categorie da mettere in evidenza) prima di scrivere copy o proporre struttura dati.

## Vincoli reali del progetto
- Non esiste un modulo "Campagne" dedicato nell'Admin (vedi `docs/kb/admin-rules.md` per l'elenco moduli reali): una campagna oggi si realizza combinando `heroFeatured` in `data/config.json` (prodotti in evidenza in home), badge/tag su prodotti (`tag`, `coll` in `products.json`), e contenuti testuali in `data/texts.json`/`data/content.json`.
- Se la campagna richiede una landing page dedicata separata da `index.html`, valuta prima con `ingly-core-architect` come inserirla senza rompere il routing statico esistente (il sito non ha un router SPA: ogni pagina è HTML statico).
- Le scadenze/countdown vanno gestite lato dati (es. data di fine in `data/config.json`), non hardcoded in JS.

## Checklist per ogni campagna
1. Copy IT/EN coerente col tono in `docs/kb/brand.md` (mai linguaggio da "SUPER SCONTO!!!").
2. Palette e componenti presi da `docs/kb/design-system.md`, eventualmente tramite un tema dedicato (coordina con `theme-management-engine`).
3. Prodotti coinvolti verificati come esistenti in `data/products.json` con `id` reali.
4. Banner/artwork generati coordinandosi con `ai-artwork-director` e `prompt-generator`.
5. Validazione finale con `brand-guardian` prima di considerare la campagna "pronta per l'Admin".
6. Pubblicazione sempre via Admin (commit atomico), mai editando `data/*.json` a mano in produzione.
