---
name: design-system-manager
description: "Gestisce il design system UI di INGLY DESIGN: componenti (card, bottoni, form, modal, sidebar, navbar), spaziature, ombre, radius, animazioni. Usa questa skill quando l'utente chiede di creare o modificare un componente UI, uno stile CSS, un'animazione o vuole capire come è organizzato il CSS del sito."
---

# Design System Manager

Leggi sempre `docs/kb/design-system.md` prima di scrivere CSS.

## Mappa dei file CSS (verifica sempre qui prima di crearne uno nuovo)
- `assets/css/variables.css` — variabili globali (colori, font, radius, ombre, scala tipografica). **Ogni nuovo token va qui**, mai hardcoded altrove.
- `assets/css/reset.css` — reset base.
- `assets/css/layout.css` — griglie e struttura di pagina.
- `assets/css/components.css` — il file più grande (~38KB): card, bottoni, form, modali, nav. **Cercare qui prima** di creare un componente, per evitare duplicati con nomi diversi.
- `assets/css/pages.css` — stili specifici di singola pagina.
- `assets/css/animations.css` — transizioni/keyframe, deve sempre usare `--ease`.
- `assets/css/responsive.css` — breakpoint e adattamenti mobile.

## Regole per nuovi componenti
1. Verifica prima se un componente simile esiste già in `components.css` (card prodotto, card categoria, bottoni primari/secondari, form field, modal, ecc.).
2. Usa solo variabili da `variables.css` per colori/spaziature/radius/ombre — mai valori hardcoded nuovi.
3. Radius standard `20px` (`--radius`), radius grande `28px` (`--radius-lg`) — non introdurre un terzo valore senza motivo.
4. Ombre: usa la scala a 4 livelli (`--elev-1` … `--elev-4`), non inventare `box-shadow` custom.
5. Animazioni: sempre `cubic-bezier(.16,1,.3,1)` (`--ease`) per coerenza di "feel".
6. Ogni componente deve funzionare col tema scuro attuale (`--paper #0a0d18` di sfondo) — verifica sempre il contrasto testo/sfondo con `--ink`/`--ink-soft`.

## Prima di consegnare
Passa il componente a `brand-guardian` per validazione finale, e a `ux-reviewer` se introduce un nuovo pattern di interazione (non solo estetico).
