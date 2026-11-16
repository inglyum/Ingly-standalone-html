# INGLY OS — Security Audit

> Contesto: oggi INGLY OS è un'app **locale single-file** (dati nel browser dell'utente). In questo contesto molti “problemi” sono accettabili. **Diventano bloccanti** solo nel passaggio a **SaaS multi-tenant**. Questo audit distingue i due scenari.

## 1. Autenticazione & autorizzazione
**Stato:** gate di login e ruoli gestiti **interamente lato client** (oggetto `Admin`, utenti in `localStorage` `ingly_access_users`, `SaaSGate`, `LicenseManager`). Controlli ruolo nel codice: **minimi** (~4 confronti `role===...`).

- 🟢 **Locale (oggi):** accettabile — è il browser dell'utente, nessun server.
- 🔴 **SaaS (futuro):** **non è sicurezza reale.** `localStorage`, una classe CSS o un check JS non proteggono nulla: chiunque può aprire i devtools e bypassare. Richiesto backend con auth reale (OAuth/OIDC), sessioni httpOnly+SameSite, permessi per-operazione applicati **server-side**, isolamento per azienda/laboratorio, audit log.

**Azione (Sprint 1):** separare nettamente modalità STANDALONE (locale, nessuna pretesa di sicurezza) da modalità SaaS (gate solo come UX, con nota esplicita che la vera autorizzazione sarà server-side). Non spacciare i gate client per sicurezza.

## 2. Credenziali & API key
**Stato:** chiavi AI in `localStorage` **in chiaro**: `ingly_api_key`, `ingly_gemini_key`, `ingly_openrouter_key`, `ingly_groq_key`, `ingly_perplexity_key`.

- 🟢 **Locale:** la chiave è dell'utente, nel suo browser — accettabile e comodo.
- 🔴 **SaaS:** in ambiente multiutente le chiavi **non devono stare in chiaro** né lato client. Richiesto vault/secret manager server-side, proxy delle chiamate AI, rotazione.

**Positivo:** in un fix precedente sono state **rimosse credenziali hardcoded** (Supabase URL+anon key) dal file: nessun segreto distribuito nel monolite. ✅ Mantenere questa regola.

**Azione:** per il SaaS, instradare le chiamate AI via backend; nel locale, continuare con chiavi utente in localStorage ma mai committarle.

## 3. Chiamate esterne / esfiltrazione dati
**Stato:** sync configurazione via **`api.jsonbin.io`** (`_cfg.jsonbinId`, 3 fetch, riga ~67405). Dati applicativi inviati a servizio terzo.

- 🟠 Verificare **cosa** viene inviato a jsonbin (solo config o anche dati cliente?). I dati IndexedDB sono locali: **non esporli a terzi senza consenso esplicito**.
- 🟠 CDN multiple (Chart.js, jsPDF, html2canvas, font-icone) → richieste a host esterni; CSP non stretta.

**Azione:** documentare/limitare l'uso di jsonbin; per dati sensibili, consenso esplicito; valutare vendoring CSP-safe.

## 4. Input & XSS
**Stato:** l'app costruisce molto HTML via template string + `innerHTML`. Le regole di progetto vietano `eval`/`new Function` (rispettato) e richiedono sanitizzazione prima di `innerHTML`.

- 🟠 Verificare che i dati utente (nomi cliente, note, descrizioni) passino da `sanitize()`/`textContent` dove iniettati in `innerHTML`. Esiste una util `sanitize()` usata in alcuni punti (es. alert magazzino) — **estenderne l'uso** a tutti i punti con dati utente.

**Azione (Sprint 1, trasversale):** audit mirato dei punti `innerHTML` con dati utente; usare `textContent`/escape/whitelist.

## 5. Integrità dati & audit log
**Stato:** esistono `history`, `versions`, `ai_log`, `notifications` (tracciamento parziale). Nessun audit log unificato delle operazioni sensibili (chi/cosa/quando).

**Azione:** audit log centrale (locale ora, server-side nel SaaS) per operazioni distruttive e finanziarie.

## 6. Multi-tenancy (SaaS futuro)
Richiesto per il cloud: isolamento per azienda, protezione API, gestione sessioni, gestione licenze reale (non `LicenseManager` client-side), rate limiting endpoint pubblici.

## 7. Riepilogo priorità
| # | Tema | Locale | SaaS | Sprint |
|---|------|--------|------|--------|
| 1 | Auth/permessi server-side | 🟢 ok | 🔴 bloccante | 1 (prep) / backend |
| 2 | API key fuori dal client | 🟢 ok | 🔴 | backend |
| 3 | jsonbin / dati a terzi | 🟠 | 🔴 | 1 |
| 4 | Sanitizzazione innerHTML | 🟠 | 🟠 | 1 |
| 5 | Audit log unificato | 🟡 | 🟠 | 5–7 |
| 6 | Multi-tenancy | n/a | 🔴 | backend |

> **Regola non negoziabile confermata:** nessun segreto hardcoded nel file; nessun gate client spacciato per sicurezza; nessuna esposizione di dati utente a terzi senza consenso.
