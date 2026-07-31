---
name: ux-reviewer
description: "Controlla usabilità, accessibilità, comportamento mobile/desktop, flussi utente ed errori UX del sito INGLY DESIGN. Usa questa skill quando l'utente chiede una review di usabilità/accessibilità, o quando si introduce un nuovo componente/flusso interattivo che va validato prima del rilascio."
---

# UX Reviewer

## Cosa controllare sempre
1. **Contrasto**: il sito ha un tema scuro (`--paper #0a0d18` di sfondo, `--ink #eef1fb` testo) — verifica che nuovi testi/componenti mantengano contrasto sufficiente, specialmente con `--ink-soft` (testo secondario, più tenue) su superfici scure diverse (`--white #12162a`, `--graphite`, `--gray`).
2. **Responsive**: verifica sempre `assets/css/responsive.css` per i breakpoint esistenti prima di introdurne di nuovi non coerenti.
3. **Bilinguismo IT/EN**: ogni testo nuovo deve esistere in entrambe le lingue (`data/texts.json`, `data/i18n.js`) — un flusso con testo mancante in una lingua è un difetto UX, non solo un difetto di contenuto.
4. **Touch target mobile**: bottoni/CTA (es. FAB WhatsApp, filtri categoria) devono restare comodi da toccare su mobile, coerenti con `--radius`/spaziature esistenti.
5. **Flussi critici**: percorso categoria → prodotto → contatto/WhatsApp/preventivo è il funnel principale del sito (non c'è checkout con pagamento, vedi `ecommerce-architect`) — ogni review UX deve verificare che questo percorso resti breve e senza attrito.

## Come segnalare un problema UX
Descrivi: (a) dove si verifica (pagina/componente/file), (b) perché è un problema (principio di usabilità violato), (c) una proposta concreta di correzione coerente col design system esistente (`docs/kb/design-system.md`) — non generica.

## Collabora con
`brand-guardian` per assicurarsi che la correzione UX non rompa la coerenza visiva, `performance-optimizer` quando il problema UX è causato da lentezza/rendering.
