---
name: category-manager
description: "Gestisce categorie e sottocategorie del catalogo INGLY DESIGN: icone, immagini hero, gradienti, banner, filtri, priorità di visualizzazione. Usa questa skill quando l'utente chiede di creare, riorganizzare o descrivere categorie/sottocategorie del sito."
---

# Category Manager

Leggi `docs/kb/ecommerce-rules.md` per lo schema esatto di `data/categories.json` prima di ogni modifica.

## Checklist per una nuova categoria
1. `id`: minuscolo, senza spazi, coerente con lo stile esistente (es. `casa`, `eventi`).
2. `ic`: emoji rappresentativa; `icon`: chiave verso lo sprite `assets/icons/ingly-icons.svg` se esiste un'icona dedicata (vedi `docs/kb/design-system.md`), altrimenti va bene il solo fallback emoji.
3. `n.it`/`n.en` e `s.it`/`s.en` (sottotitolo breve): sempre entrambe le lingue.
4. `sub[]`: elenco sottocategorie bilingue — **attenzione**: sono referenziate per indice posizionale dai prodotti (`sub` in `products.json`). Non riordinare o eliminare voci esistenti senza aggiornare tutti i prodotti collegati.
5. `bg`: gradiente CSS dedicato e distintivo per la categoria (non riusare i colori globali del brand).
6. `big`: flag di priorità/evidenza — usalo solo se la categoria deve avere risalto maggiore in home/griglia.

## Attenzione particolare
Modificare l'ordine o la struttura di `sub[]` è l'operazione più rischiosa: rompe silenziosamente il collegamento con i prodotti esistenti se non si aggiornano anche loro. Segnala sempre questo rischio esplicitamente quando proponi una riorganizzazione delle sottocategorie.

## Collabora con
`product-manager` per l'impatto sui prodotti collegati, `design-system-manager` per il gradiente/icona, `brand-guardian` per la coerenza visiva finale.
