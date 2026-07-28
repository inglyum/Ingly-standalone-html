# MASTER AUDIT — INGLY DESIGN
**Data:** 2026-07-28 · **Commit analizzato:** `e38003e` (live) · **Autore:** analisi tecnica pre-implementazione

Questo documento è la consegna richiesta prima di scrivere codice. Nessun modulo è
stato implementato. Le priorità qui sotto **non seguono l'ordine dei 18 moduli
richiesti**, perché l'analisi ha trovato due difetti che rendono inutile qualunque
lavoro SEO finché non sono risolti.

---

## 0. SINTESI ESECUTIVA

> **Il catalogo di INGLY DESIGN non è indicizzabile da Google.**
> Non per mancanza di Schema.org o di ottimizzazione AI, ma perché **i 90 prodotti
> non hanno un indirizzo web proprio** e **la sitemap dichiara indirizzi in un
> formato che il sito non usa più**.

Costruire i moduli SEO/GEO su queste fondamenta significherebbe generare metadati
perfetti per pagine che nessun motore può raggiungere. Vanno risolti per primi.

| | Problema | Effetto |
|---|---|---|
| **P0-1** | Tutti i prodotti vivono su `/product` | 90 prodotti = 1 sola pagina indicizzabile |
| **P0-2** | Sitemap con URL `/#/…`, sito con URL `/…` | 97 URL su 98 non corrispondono a nulla |

Risolti questi due punti, il progetto ha basi tecniche **buone**: architettura a
moduli ES pulita, dati centralizzati in JSON, CI di validazione, admin Git-based.
Il lavoro SEO/GEO diventa allora un'estensione naturale, non una riscrittura.

---

## 1. ARCHITETTURA

### Stato
- SPA statica su GitHub Pages + Cloudflare. Nessun backend, nessun database.
- 15 moduli ES (`180 KB`) + bundle UMD di riserva. Catena: `app.js → data-loader.js → main.js`.
- Dati: 6 file JSON (`161 KB`) come unica fonte di verità.
- Admin: `admin.html` monolitico da **241 KB**, pubblica via Git Data API con commit atomico.

### Punti di forza
- Separazione dati/presentazione già corretta: i moduli SEO possono leggere dai JSON senza toccare il rendering.
- `healData()` e `matArt()` come reti di sicurezza: il sito non crolla su dati imperfetti.
- Pubblicazione atomica (un solo commit): niente stati intermedi.

### Debolezze
| Problema | Gravità | File |
|---|---|---|
| `admin.html` è un monolite da 241 KB: HTML, CSS e ~4.000 righe di JS in un file | **High** | `admin.html` |
| Nessun sistema di build: impossibile fare code splitting, minificazione, critical CSS | Medium | — |
| `app.fallback.js` va aggiornato a mano a ogni modifica di `main.js` | Medium | `assets/js/app.fallback.js` |
| Nessun test end-to-end sul sito pubblico (esistono solo test su dati/CSS/admin) | Medium | `tests/` |

---

## 2. SEO — LE CRITICITÀ VERE

### 🔴 P0-1 · I prodotti non hanno un URL proprio
**File:** `assets/js/products.js:195`

```js
export function openProduct(id){ … renderPP(); go('product') }   // ← id non passato
```

`go(page, search)` accetta un secondo parametro, ma qui non viene usato. Risultato:
aprire il prodotto #1 o il #90 produce sempre lo stesso indirizzo `/product`.

- Nessun prodotto è linkabile, condivisibile o indicizzabile singolarmente.
- Il JSON-LD `Product` viene generato, ma su una URL che cambia contenuto: Google lo scarta.
- L'infrastruttura per risolverlo **esiste già**: `currentSearch()` in `navigation.js:18`
  legge `?id=`, e `products.js:739` genera già link `/product?id=N`. Manca solo il collegamento.

**Impatto:** massimo. È il difetto SEO più costoso dell'intero progetto.
**Rischio della correzione:** basso.

### 🔴 P0-2 · La sitemap dichiara URL che il sito non serve
**File:** `admin.html` (generazione sitemap in fase di pubblicazione), `sitemap.xml`

```js
urls.push(['/#/'+p, …])                       // shop, digital, business…
urls.push(['/#/product?id='+p.id, …])         // 90 prodotti
```

Il router usa la History API con URL puliti (`/shop`) da quando è stato rimosso l'hash,
ma il generatore della sitemap non è stato aggiornato. **97 URL su 98 contengono `#`**,
e Google tratta tutto ciò che segue `#` come la stessa pagina: la sitemap dichiara
di fatto un solo indirizzo.

Peggio: la sitemap viene **rigenerata a ogni pubblicazione**, quindi si riscrive
sbagliata da sola.

**Impatto:** massimo. **Rischio della correzione:** basso.

### 🟠 Altre carenze SEO (dopo P0)
| | Problema | Priorità |
|---|---|---|
| Meta | `title`/`description` non differenziati per prodotto lato server (solo via JS) | High |
| Canonical | Uno solo, statico su `/` — non segue la pagina | High |
| Prerender | Contenuto 100% client-side: i crawler senza JS vedono una pagina vuota | High |
| Immagini | 90 prodotti su 93 senza foto → nessun `ImageObject`, feed Merchant inutilizzabile | High |
| Blog | Assente. Nessuna superficie per keyword informazionali ("come incidere il legno") | Medium |
| Breadcrumb | JSON-LD presente ma con URL non validi (vedi P0-1) | Medium |

### Schema.org — stato reale
Già presenti: `LocalBusiness`, `Organization`, `Product`, `Offer`, `AggregateRating`,
`FAQPage`, `BreadcrumbList`, `ItemList`, `Brand`, `MerchantReturnPolicy`,
`OfferShippingDetails`, `GeoCoordinates`, `OpeningHoursSpecification`.

**La base c'è ed è di buona qualità.** Mancano: `WebSite`+`SearchAction`, `CollectionPage`,
`Article`/`BlogPosting`, `VideoObject`, `Person`, `ImageObject`. Il MODULO 2 è quindi
un **completamento**, non una costruzione da zero — molto meno lavoro del previsto.

---

## 3. PERFORMANCE

| Voce | Stato | Note |
|---|---|---|
| CSS | 118 KB non minificati, 7 file | Nessun critical CSS, tutto bloccante |
| JS | 180 KB moduli + bundle UMD caricato **sempre** | Il fallback si scarica anche quando non serve |
| Immagini | 4,9 MB, varianti 400/800 solo per 3 prodotti | Nessun AVIF |
| Font | Google Fonts esterni, 5 famiglie | Bloccante, dominio terzo |
| Service Worker | ✅ corretto in questa sessione (network-first su CSS/JS) | — |

**Nota onesta:** l'obiettivo *PageSpeed > 95* è raggiungibile, ma non senza toccare
le animazioni (canvas particellare a `requestAnimationFrame` continuo, blob animati,
cursore luminoso). Sono elementi identitari del design. **Non li toccherò senza tua
approvazione esplicita**, come richiesto dalle tue regole.

---

## 4. SICUREZZA

Il progetto è **statico**: non esistono server, database né API proprietarie.
Di conseguenza **SQL Injection, CSRF e Rate Limiting non sono applicabili** —
non c'è superficie d'attacco. Dichiararli "implementati" sarebbe disonesto.

Ciò che è applicabile e va fatto:

| | Voce | Stato | Priorità |
|---|---|---|---|
| ✅ | Nessuna chiave API nel front-end (Regola 6) | Rispettato | — |
| ⚠️ | **XSS**: dati JSON iniettati via `innerHTML` senza escape | **Da correggere** | **High** |
| ❌ | Content-Security-Policy | Assente | High |
| ❌ | Security headers (`X-Content-Type-Options`, `Referrer-Policy`) | Assenti | Medium |
| ⚠️ | Token GitHub in `localStorage` | Accettabile ma migliorabile (`sessionStorage`) | Medium |

**XSS — dettaglio:** l'admin è l'unico autore dei contenuti, quindi il rischio pratico
è basso, ma un backup manomesso o un import di terzi potrebbe iniettare script.
Va introdotto un helper di escape centralizzato.

**CSP — nota:** su GitHub Pages non si possono impostare header HTTP. Si può usare
`<meta http-equiv="Content-Security-Policy">`, che copre la maggior parte dei casi
ma **non** `frame-ancestors`. Per gli header veri servirebbe Cloudflare (Transform
Rules), che è già davanti al sito: fattibile, ma è configurazione, non codice.

---

## 5. AI SEARCH (GEO) — VALUTAZIONE ONESTA

Questa è la parte dove devo essere più diretto, perché la richiesta contiene
un'assunzione tecnica che non regge.

### Cosa NON è tecnicamente possibile
> «Ogni pagina riceve: Google AI Score, ChatGPT Score, Gemini Score, Claude Score,
> Perplexity Score, Copilot Score»

**Nessuno di questi motori espone un punteggio.** Non esistono API pubbliche che
dicano "questa pagina vale 82/100 per Gemini". Qualunque numero mostrato sarebbe
**inventato da noi** — un placebo che darebbe una falsa sensazione di controllo e
ti farebbe prendere decisioni su dati finti.

### Cosa invece è reale e faremo
Ciò che è dimostrato influenzare la citabilità nei motori AI:

1. **Contenuto leggibile senza JavaScript** — oggi il sito è invisibile ai crawler
   AI, che quasi mai eseguono JS. *Questo è il vero collo di bottiglia GEO.*
2. **Struttura semantica**: heading gerarchici, risposte dirette a domande esplicite.
3. **Dati strutturati completi e coerenti.**
4. **Blocchi domanda→risposta** (le AI citano volentieri le FAQ).
5. **`llms.txt`** — standard emergente per dichiarare i contenuti alle AI.
6. **Entità e fatti espliciti** (materiali, tempi, misure) invece di prosa vaga.

**Proposta:** invece di 7 punteggi finti, un **GEO Readiness Check** che verifica
criteri oggettivi e verificabili (contenuto pre-renderizzato sì/no, FAQ presenti,
schema valido, risposta diretta nei primi 200 caratteri…). Un numero che **significa
qualcosa** e su cui puoi agire.

Attendo la tua conferma su questo punto, come previsto dalle tue regole.

---

## 6. MODULI RICHIESTI — FATTIBILITÀ REALE

Legenda: ✅ fattibile ora · ⚙️ fattibile con GitHub Actions · 🔒 richiede backend/segreti · ❌ non fattibile

| # | Modulo | Fatt. | Nota |
|---|---|---|---|
| 1 | SEO Engine | ✅ | Redirect Manager limitato: GitHub Pages non fa redirect server-side (solo via `404.html`) |
| 2 | Schema.org Engine | ✅ | Completamento di quanto già esiste |
| 3 | AI Search (GEO) | ⚠️ | Realizzabile **solo** come check oggettivo, non come punteggi per motore (§5) |
| 4 | Knowledge Graph | ✅ | Ottimo rapporto valore/costo |
| 5 | Content Engine | ✅ | Usa la chiave AI già presente nell'admin |
| 6 | FAQ Engine | ✅ | Alto valore per GEO |
| 7 | Internal Linking | ✅ | — |
| 8 | Blog Engine | ✅ | Il pezzo più grosso; JSON + pagine statiche |
| 9 | Image SEO | ✅ | ALT/compressione ok. AVIF: fattibile in Actions |
| 10 | Performance | ✅ | Serve un build step; impatta le animazioni (§3) |
| 11 | Merchant Feed | ✅ | Generazione feed ok. **Serve però che i prodotti abbiano URL e foto** |
| 12 | SEO Dashboard | ⚙️ | Controlli 404/broken link richiedono un job schedulato |
| 13 | Competitor Analyzer | 🔒 | Il browser non può leggere siti terzi (CORS). Servirebbe un proxy/Action |
| 14 | Google Integration | 🔒 | Search Console/GA4/Merchant richiedono OAuth e **segreti**: viola la Regola 6. GA4 e Consent Mode lato client sì |
| 15 | Social Engine | ✅ | Generazione testi sì; pubblicazione automatica no (serve backend) |
| 16 | AI Assistant admin | ✅ | Estensione dell'AI già integrata |
| 17 | Monitoraggio giornaliero | ⚙️ | Fattibile con Actions **in sola lettura**: la Regola 5 vieta commit automatici |
| 18 | Configurazione | ✅ | — |

**Conflitti con le regole non negoziabili del progetto** (`.claude/rules/non-negotiable.md`):
- MODULO 14 vs **Regola 6** (nessuna chiave API nel front-end) → integrazioni server-side impossibili senza backend.
- MODULO 17 vs **Regola 5** (nessun commit automatico) → il monitoraggio può solo *segnalare*, non *correggere*.

Non aggirerò queste regole: sono derivate da bug di produzione reali. Se vuoi
superarle serve una decisione architetturale esplicita (§8).

---

## 7. ROADMAP A MILESTONE

Ogni milestone è indipendente, testata e reversibile con un singolo revert.

| M | Contenuto | Priorità | Stima |
|---|---|---|---|
| **M0** | **Fondamenta URL**: URL prodotto univoci + sitemap corretta + canonical dinamico | 🔴 **P0** | 1 sessione |
| **M1** | SEO Engine + pannello «SEO & AI ENGINE» nell'admin | High | 1–2 |
| **M2** | Schema.org Engine (completamento) + Knowledge Graph | High | 1–2 |
| **M3** | Pre-render statico delle pagine (il vero abilitatore GEO) | High | 2–3 |
| **M4** | FAQ Engine + Content Engine + AI Assistant | High | 2 |
| **M5** | Image SEO + Merchant Feed | Medium | 1–2 |
| **M6** | Blog Engine | Medium | 3–4 |
| **M7** | Performance & Core Web Vitals | Medium | 2 |
| **M8** | SEO Dashboard + monitoraggio (Actions, sola lettura) | Medium | 2 |
| **M9** | Social Engine + hardening sicurezza (CSP, escape XSS) | Low | 2 |

**M3 è il punto di svolta per l'obiettivo AI-First.** Senza contenuto leggibile
senza JavaScript, i moduli 1-2 producono metadati che ChatGPT e Perplexity non
vedranno mai. Se dovessi scegliere una sola milestone oltre a M0, sceglierei M3.

---

## 8. RISCHI

| Rischio | Probabilità | Mitigazione |
|---|---|---|
| Il pre-render (M3) richiede un build step: cambia il flusso di pubblicazione dell'admin | Alta | Generazione in GitHub Actions **senza commit automatici**: l'Actions produce artefatti, l'admin resta l'unico a committare |
| Le ottimizzazioni performance degradano le animazioni identitarie | Media | Ogni modifica dietro interruttore, approvazione preventiva |
| `admin.html` a 241 KB: aggiungere 18 pannelli lo rende ingestibile | **Alta** | Estrarre i moduli admin in file separati **prima** di M1 |
| Le 90 immagini mancanti rendono inutile il Merchant Feed | Certa | Dipende da te: sono contenuti da caricare |
| Regressioni su un sito in produzione | Media | Test in browser reale prima di ogni deploy (metodo già in uso in questa sessione) |

---

## 9. NOTA SULLE SKILL ESTERNE

Il repository `alirezarezvani/claude-skills` non è stato utilizzato. Non installo
codice di terze parti non verificato dentro un progetto in produzione, e in questo
ambiente dispongo di un set di skill già definito. Tutte le funzionalità qui
previste sono realizzabili internamente, in linea con la tua regola
*«Mai usare plugin esterni se la funzione può essere sviluppata internamente»*.

---

## 10. RICHIESTA DI APPROVAZIONE

Come da tue istruzioni, non procedo senza conferma. Servono tre decisioni:

1. **Parto da M0?** (URL prodotto + sitemap) — è il presupposto di tutto il resto.
2. **GEO: check oggettivo invece dei 7 punteggi per motore?** (§5)
3. **Estraggo i moduli admin da `admin.html` prima di M1?** — senza questo, i 18
   pannelli renderanno il file impossibile da mantenere.
