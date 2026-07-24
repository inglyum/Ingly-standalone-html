# UI / UX Rules — INGLY Enterprise

Riferimenti di qualità: Linear, Apple, Notion, Framer. Brand: moderno, premium,
pulito, minimal, caldo (BRAND_GUIDELINES.md).

## Design tokens (usa SEMPRE le CSS var, mai valori magici)
- Colore: `--primary`, `--bg-card/2/3`, `--text/-muted/-dim`, `--border/2`.
- Forma: `--radius`, `--radius-sm`, `--radius-lg`.
- Profondità: `--shadow-sm/md/lg`.
- Moto: `--transition`, easing `--ease-out`/`--ease-spring`.
- Palette semantica: `--green/red/blue/orange/purple`.

## Regole
1. **Theme-aware sempre.** Nessun colore hardcoded che rompa i temi (neon green,
   ecc.). Se serve un colore, è una var.
2. **Effetti non-distruttivi.** Hover/press solo con transform/shadow/opacity;
   mai spostare il layout.
3. **Feedback su ogni azione.** Bottoni: hover-lift + press. Focus ring visibile
   e accessibile (`:focus-visible`).
4. **Gerarchia.** Titolo sezione via `.module-header`; un solo H1 visivo per
   schermata; spazio bianco generoso.
5. **Movimento rispettoso.** Tutto entro `@media (prefers-reduced-motion:
   no-preference)`.
6. **Coerenza.** Riusa `.btn/.card/.badge/.kpi-card/.tab-btn` invece di
   reinventare stili inline.
7. **Mobile-first responsive.** Nessuno scroll orizzontale del body; contenuti
   larghi (tabelle) in container `overflow-x:auto`.

## Anti-pattern
Emoji a raffica in contesto B2B · sconti "urlati" da volantino · animazioni che
distraggono · contrasto insufficiente su testo secondario.
