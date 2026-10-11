# Security Findings — INGLY OS SaaS (FASE ZERO)

**Data:** 2026-10-11 · Sorgenti: `saas-source/INGLY-OS_14.html` (OS v96), `saas-source/INGLY-CLOUD-ADMIN_11.html`
Legenda stato: **CONFERMATO** (difetto riprodotto/verificato) · **RISCHIO** (potenziale, non riproducibile senza backend) · **FALSO-POSITIVO** (scartato con evidenza).

---

### SEC-0 — Scartato: "JWT/secret trapelati" → FALSO-POSITIVO
- **Evidenza:** le stringhe `eyJ…` segnalate da uno scan ingenuo sono **frammenti di base64 di font/immagini** (`data:font/woff2;base64,…`, riga 111632 OS) e di blob binari (Admin righe 53–83), non token.
- **Esito:** nessun JWT/segreto trapelato in quelle posizioni. Nessun `service_role` presente (grep = 0 in entrambi i file).
- **Perché documentato:** la FASE ZERO impone di distinguere difetto reale da rumore. Non va riportato come leak.

### SEC-1 — Autorizzazione applicata solo lato client — **RISCHIO (alto)**
- **Modulo:** OS v96 (ruoli/login), Admin (superadmin/role, login form riga ~5262).
- **Evidenza:** gate di ruolo/login in JS nel browser; nessuna verifica server osservabile nei file. L'unico controllo server possibile è via RLS Supabase.
- **Causa radice:** architettura client-only; i privilegi non sono verificati server-side come richiesto (command §5.1).
- **Rischio:** un utente può aggirare i controlli JS (dev tools) e, se le policy RLS non sono restrittive, leggere/scrivere dati non suoi.
- **Soluzione:** auth reale (Supabase Auth), autorizzazione server-side, RLS con test negativi cross-tenant (command §5.1/§5.2).
- **Test:** test negativo "tenant A non legge dati tenant B"; "ruolo senza permesso → 403".
- **Stato:** da verificare lato backend → **blocco: credenziali Supabase assenti** (no egress + no token). Documentato.

### SEC-2 — Chiavi AI utente in localStorage, chiamate browser→provider — **CONFERMATO (P1)**
- **Evidenza:** `const key = (localStorage.getItem('ingly_api_key')||'').trim()` (OS riga 9157; idem `ingly_gemini_key` 9171/9185, `ingly_openrouter_key` 9200, `ingly_groq_key` 9215); header `x-api-key`/`Authorization: Bearer ${key}` (righe 9161/9205/9488).
- **Natura:** NON è un segreto condiviso trapelato — sono **chiavi personali dell'utente**. Tuttavia: (a) esposte a qualunque XSS; (b) chiamate browser→Anthropic normalmente bloccate da CORS/prohibited; (c) nessun tracciamento costi/limiti per tenant.
- **Soluzione:** adapter AI **server-side** (command §8 "AI e automazioni"), chiavi condivise mai nel browser, chiavi personali con policy di conservazione/cancellazione documentata.
- **Test:** adapter con mock provider; verifica che il browser non riceva mai una chiave condivisa.
- **Stato:** progettazione adapter possibile subito; verifica reale provider → blocco credenziali.

### SEC-3 — anon key Supabase nel frontend senza garanzia RLS — **RISCHIO (alto)**
- **Evidenza:** Admin effettua chiamate PostgREST dirette (`Prefer: return=representation`, riga 5947; `?apikey=`), OS usa Supabase REST. Nessun `service_role` (buono).
- **Nota:** l'anon key nel frontend è accettabile **solo se** le policy RLS sono restrittive. Le policy non sono nei file → non verificabili qui.
- **Soluzione/Test:** audit RLS sul progetto Supabase + test negativi d'isolamento (command §5.2).
- **Stato:** **blocco: accesso Supabase assente.** Documentato, non dichiarabile sicuro né insicuro senza verifica.

### SEC-4 — 505 `catch(){}` vuoti (OS) / 23 (Admin) — **CONFERMATO (P0 integrità)**
- **Evidenza:** `grep -oE "catch\s*\([^)]*\)\s*\{\s*\}"` → 505 in OS v96, 23 in Admin.
- **Causa radice:** errori di scrittura/sync/quota ingoiati silenziosamente → un salvataggio può "sembrare" riuscito pur essendo fallito (viola command §5.4 e regola "vietato dichiarare salvataggio riuscito dopo errore ignorato").
- **Rischio:** perdita dati silenziosa, stato incoerente, sync fantasma.
- **Soluzione:** NON rimuovere meccanicamente. Classificare per categoria (scrittura IDB, fetch, parse, UI) e definire comportamento: log + messaggio utente + impedire conferma + retry quando appropriato.
- **Test:** scenari quota esaurita, DB indisponibile, rete interrotta, errore API, record duplicato (command §5.4).
- **Stato:** inventario fatto; correzione incrementale per categoria (P0/P1 iterativo), non in un colpo solo.

### SEC-5 — Nessun harness di verifica per i monoliti — **CONFERMATO (P0 processo)**
- **Evidenza:** nessun parser/syntax-check per `saas-source/*.html`; i test del repo coprono solo il sito statico.
- **Rischio:** qualunque futura modifica a 11,8 MB di monolite è non verificata → rischio di rottura runtime invisibile.
- **Soluzione:** harness che (1) fa il parse di tutti i blocchi `<script>` e (2) asserisce assenza di `service_role`/segreti condivisi (lock del buono). → implementato in questa P0.
- **Stato:** IN IMPLEMENTAZIONE (vedi `tests/`).

---

## Priorità sintetica
| ID | Gravità | Blocco credenziali? | Azione ora |
|---|---|---|---|
| SEC-5 | P0 | no | ✅ harness verifica + secret-scan (questa iterazione) |
| SEC-4 | P0 | no | inventario + piano per categoria; fix incrementale |
| SEC-1/3 | P0/P1 | **sì** (Supabase) | progettare auth/RLS + test negativi; verifica reale bloccata |
| SEC-2 | P1 | parziale | progettare adapter AI server-side |
| SEC-0 | — | — | scartato (falso positivo) |
