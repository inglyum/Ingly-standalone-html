# Performance, Accessibility, SEO Rules — INGLY Enterprise

## Performance (monolite ~100k righe)
- **Non caricare tutto in una volta**: le sezioni si renderizzano on-demand
  (`.section-view.active`, `contain:layout`). Non rompere questo pattern.
- Evita reflow ripetuti: batch le scritture DOM, usa `DocumentFragment`.
- IndexedDB: usa gli indici, evita full-scan (`getAll` + filter) su store grandi
  quando esiste una chiave. Cache via `AppStore`, invalida in modo chirurgico.
- Animazioni: solo proprietà compositabili (`transform`, `opacity`).
- Nessuna dipendenza esterna a runtime (tutto vendored, CSP-safe).

## Accessibility (WCAG AA come baseline)
- `:focus-visible` ring su ogni elemento interattivo (già nel layer polish v49).
- Contrasto testo ≥ 4.5:1 (attenzione a `--text-dim` su fondi chiari).
- Target touch ≥ 40px. Label associate agli input.
- `prefers-reduced-motion` rispettato per tutte le animazioni.
- Icone decorative con `aria-hidden`; azioni icona con label accessibile.

## SEO (per la futura vetrina web / catalogo pubblico)
- `<title>` e meta description per pagina/sezione pubblica.
- URL parlanti, dati strutturati (Product, Offer, LocalBusiness — Ingly Design,
  San Cipirello PA).
- Immagini con `alt`, `loading="lazy"`, dimensioni esplicite.
- Sitemap + Google Business coerenti col brand locale (Valle del Belice).
