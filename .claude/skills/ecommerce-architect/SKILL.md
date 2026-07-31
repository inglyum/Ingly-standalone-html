---
name: ecommerce-architect
description: "Gestisce l'intera logica ecommerce di INGLY DESIGN: homepage, categorie, prodotti, varianti, filtri, ricerca, wishlist, carrello, checkout, offerte, bundle, cross-selling e upselling. Usa questa skill per qualunque richiesta su prodotti, categorie, prezzi, catalogo, funnel d'acquisto o logiche di vendita del sito. Attivala anche quando l'utente chiede di aggiungere/modificare un prodotto o una categoria."
---

# Ecommerce Architect

Prima di ogni modifica, leggi `docs/kb/ecommerce-rules.md` (schema reale di `products.json`/`categories.json`) e `docs/kb/brand.md`.

## Stato reale del funnel (non dare per scontate feature "da ecommerce classico")
Il sito attuale è catalogo + richiesta preventivo/contatto (WhatsApp/form), **non** un carrello/checkout con pagamento online: verifica sempre in `assets/js/` (`products.js`, `forms.js`) e in `docs/ARCHITECTURE.md` prima di assumere che esista carrello, wishlist o checkout con pagamento — se non ci sono, e l'utente li chiede, trattali come feature nuove da progettare, segnalando che richiedono probabilmente la "Fase D" (backend, vedi `docs/kb/roadmap.md`) se prevedono pagamenti reali.

## Quando aggiungi/modifichi un prodotto
1. Verifica che `cat` corrisponda a un id esistente in `data/categories.json` e che `sub` sia un indice valido dentro `categories[cat].sub`.
2. Compila sempre `n.it` e `n.en`.
3. `mat` deve essere un materiale coerente con `docs/kb/laser-business.md`.
4. Ricorda che i JSON non si toccano mai a mano in produzione (vedi `docs/kb/admin-rules.md`) — per lavoro locale/bozza è ok, ma va sempre segnalato come bozza da pubblicare via Admin.

## Quando aggiungi/modifichi una categoria
1. `id` in minuscolo senza spazi, coerente con lo stile esistente (`casa`, `eventi`, ...).
2. `bg` è un gradiente CSS dedicato alla categoria (non riusare i colori globali di brand, vedi `docs/kb/ecommerce-rules.md`).
3. Ogni sottocategoria in `sub[]` è bilingue e referenziata per **indice posizionale** dai prodotti: attenzione a non spostare/eliminare elementi dell'array senza aggiornare i prodotti collegati.

## Cross-selling / bundle / upselling
Non esiste ad oggi un motore di raccomandazione nel codice: eventuali "prodotti correlati" andrebbero implementati lato dati (es. campo `coll` in `products.json`, già usato per collection come `"best"`) prima ancora che lato UI. Proponi sempre prima la struttura dati minima, poi la UI.

## Collabora con
`category-manager` e `product-manager` per il dettaglio operativo di categorie/prodotti, `brand-guardian` per la coerenza visiva di card/badge, `admin-panel-architect` per come queste modifiche arrivano davvero in produzione.
