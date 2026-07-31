---
name: product-manager
description: "Gestisce il catalogo prodotti di INGLY DESIGN: creazione/modifica prodotti, varianti, materiali, tecniche (incisione, UV, DTF, stampa 3D), prezzi, SKU/id, tag, SEO prodotto. Usa questa skill quando l'utente chiede di aggiungere, modificare, rimuovere o descrivere un prodotto specifico del catalogo."
---

# Product Manager

Leggi `docs/kb/ecommerce-rules.md` (schema esatto di `data/products.json`) e `docs/kb/laser-business.md` (materiali/tecniche reali) prima di ogni intervento.

## Checklist per un nuovo prodotto
1. `id`: numerico, univoco, successivo all'ultimo esistente in `data/products.json`.
2. `cat`: deve esistere in `data/categories.json`. `sub`: indice valido dentro `categories[cat].sub`.
3. `n.it` / `n.en`: entrambi compilati, stile coerente col tone of voice (`docs/kb/brand.md`).
4. `mat`: materiale reale (Legno, Plexiglass, Acciaio, Alluminio, ecc. — vedi `docs/kb/laser-business.md`), coerente con la tecnica descritta nel nome/testo.
5. `price`: numero, EUR implicito.
6. `icon`: emoji rappresentativa, coerente con lo stile già usato nel catalogo (verifica prodotti simili esistenti).
7. `coll`/`tag`: solo se il prodotto appartiene davvero a una collection/promo attiva — non aggiungere badge "Best"/promozionali senza motivo reale.

## SEO prodotto
Il sito ha SEO gestita centralmente (`assets/js/seo.js`, `data/config.json.seo`): per un singolo prodotto, assicurati che nome e descrizione contengano naturalmente termini reali del business (incisione laser, stampa UV, taglio laser, Cesena) senza keyword stuffing innaturale.

## Non dimenticare mai
Qualunque modifica ai JSON descritta qui è per **bozza/pianificazione**: la pubblicazione reale segue sempre `docs/kb/admin-rules.md` (Admin, commit atomico) — segnalalo esplicitamente quando consegni una proposta di prodotto.

## Collabora con
`category-manager` per la coerenza con le sottocategorie, `ai-artwork-director`/`prompt-generator` per la foto prodotto, `brand-guardian` per la validazione finale.
