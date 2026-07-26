---
name: ui-design
description: Elevare grafica/UX del gestionale INGLY (app-tool single-file) a livello premium (Linear/Apple/Notion) senza rompere temi né layout. Usare per lavoro di design, refactor visivo, information design di sezioni.
---

# ui-design — salto di qualità UI/UX per INGLY

## Principio zero: onora il sistema esistente
Precedenza: parole dell'utente → design system del progetto → tue scelte.
INGLY ha già: token in `:root` (`--primary`, `--bg-card/2/3`, `--text/-muted/-dim`,
`--border/2`, `--radius`, `--shadow-*`, `--ease-out/spring`), `.module-header`,
e i layer polish `#v49-ui-polish`. **Non cambiare i VALORI dei token** (i temi
ci dipendono): aggiungi layer additivi che usano i token.

## È un TOOL, non un documento → information design
- Somma prima del dettaglio; stato codificato nella forma (pill/chip/striscia
  severità), non solo nel numero.
- **Colore semantico** (verde/giallo/rosso = good/warning/critical) è SEPARATO
  dall'accento del brand.
- Numeri incolonnati → `font-variant-numeric: tabular-nums`. Sempre, per KPI,
  tabelle, valute.
- Ciò che è interattivo deve sembrare interattivo (hover/press/focus — già fatto).

## Le 5 leve del salto di qualità (in ordine di impatto/rischio)
1. **Tipografia & numeri** (rischio ~0): scala tipografica coerente, `tabular-nums`
   su dati, `text-wrap:balance` sui titoli, letter-spacing su label maiuscole,
   line-height generosi. Eleva OGNI schermata.
2. **Elevazione & profondità** (rischio ~0): ombre a più livelli (non una sola),
   gerarchia di superfici (card > card2 > card3), bordi sottili coerenti.
3. **Movimento & fluidità** (rischio basso): transizioni pagina con easing
   `--ease-out`, micro-interazioni, `prefers-reduced-motion` rispettato.
4. **Densità & ritmo** (rischio medio): spaziatura a griglia coerente (gap, non
   margin), allineamento, respiro. Attenzione a non spostare layout esistenti.
5. **Colore & accento** (rischio alto — tocca i temi): rifinire l'uso
   dell'accento, neutri con leggera deriva di tinta. Solo con approvazione.

## Regole non negoziabili (dopo l'incidente freeze v53)
- **Solo CSS additivo** per il visivo. Nessuna modifica a JS/logica.
- **Solo** `transform`/`box-shadow`/`opacity`/`filter`/`font-*`/`color` → mai
  proprietà che spostano il layout (width/display/position) su elementi esistenti.
- Theme-aware: usa le CSS var, verifica su tema default E scuro.
- `@media (prefers-reduced-motion: no-preference)` attorno alle animazioni.
- **VERIFICA CON DATI REALI**: dopo ogni modifica, test in browser importando il
  backup reale (non solo a vuoto) — un layout può reggere a vuoto e rompersi con
  dati. Poi `verify-syntax.mjs`.

## Riferimenti di qualità
Linear (densità+calma), Apple HIG (chiarezza, deferenza, profondità), Notion
(gerarchia tipografica), Framer (motion). Brand INGLY: moderno, premium, pulito,
minimal, caldo (BRAND_GUIDELINES.md).
