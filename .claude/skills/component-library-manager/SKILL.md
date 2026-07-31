---
name: component-library-manager
description: "Gestisce la libreria di componenti UI di INGLY DESIGN: card, widget, form, popup, drawer, dialog, toast, hero, carousel, grid. Usa questa skill quando l'utente chiede un nuovo componente UI riusabile o vuole sapere quali componenti esistono già prima di crearne uno nuovo."
---

# Component Library Manager

Prima di creare un componente nuovo, cerca sempre in `assets/css/components.css` (il file più grande, ~38KB) e nei frammenti HTML in `components/` (`header.html`, `hero.html`, `footer.html`, `components/sections/`) se esiste già qualcosa di simile.

## Inventario di partenza (verifica sempre contro il codice reale, questa lista è indicativa)
- **Card**: prodotto, categoria — verifica varianti esistenti prima di crearne una nuova.
- **Hero**: `components/hero.html` — sezione hero della homepage.
- **Header/Footer**: `components/header.html`, `components/footer.html`.
- **Sezioni**: `components/sections/` (vedi il relativo `README.md` per le convenzioni interne).
- **FAB WhatsApp**: componente fisso definito via `data/config.json.whatsappFab`.

## Regole per un nuovo componente
1. Solo variabili da `assets/css/variables.css` per colori/spaziature/radius/ombre (vedi `docs/kb/design-system.md`).
2. Se il componente esiste in forma simile, **estendilo** (modificatori/varianti CSS) invece di duplicarlo con un nome diverso.
3. Ogni componente interattivo nuovo (popup, drawer, dialog, toast) va verificato anche con `ux-reviewer` per accessibilità/mobile prima del rilascio.
4. Componenti che mostrano dati (card prodotto/categoria) devono leggere sempre dallo schema reale in `docs/kb/ecommerce-rules.md`, non da dati inventati/hardcoded nell'HTML.

## Output
Quando crei un componente, documenta anche dove va inserito (quale file HTML/sezione) e quali variabili CSS introduce eventualmente in `variables.css`, così `design-system-manager` può tenerne traccia.
