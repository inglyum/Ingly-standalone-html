# INGLY OS — come testarlo e provarlo

Due livelli: **① provare l'app** (per usarla) e **② provare la toolchain** (test, build, CI — per chi sviluppa).

---

## ① Provare l'app (semplice, senza installare nulla)

L'app è un **singolo file HTML** offline: si apre nel browser e funziona, senza rete.

1. Scarica il file più recente: **`INGLY-OS-v74-STANDALONE.html`** (il numero più alto = versione più nuova).
2. **Doppio click** sul file → si apre nel browser (Chrome/Edge/Firefox consigliati).
3. I tuoi dati restano nel browser (IndexedDB). Per portarli su un altro PC usa **Impostazioni → Backup** (esporta/importa).

### Cosa provare (le novità)
| Dove | Cosa |
|---|---|
| **Dashboard** | Command bar azioni rapide + briefing "🧠 Intelligence" (KPI settimana vs €375) |
| **Attrezzature** | `📋 Schede Macchine` · `🏭 Catalogo` · `📈 Investimenti & ROI` |
| **Materiali** | `🛰️ Market Hub` · `➕ Consumabili tipici` (subli/UV/DTF) |
| **Fornitori** | `🛰️ Market Hub` → directory + Ricerca Mercato AI + Hunting |
| **Impostazioni** | `⚙️ Personalizza dati` · `🧾 Audit & Checkpoint` |
| Topbar | icone secondarie raccolte nel menu `⋯` |

> Consiglio: prima di provare cose importanti, crea un **checkpoint** (Impostazioni → 🧾 Audit & Checkpoint → *Crea checkpoint*): potrai tornare indietro.

---

## ② Provare la toolchain di sviluppo (test, build, CI)

Serve **Node 22+**. Dal terminale, nella cartella del progetto:

```bash
# 1. installa le dipendenze di sviluppo
npm ci        # (o: npm install)

# 2. scarica il browser per i test (solo la prima volta)
npx playwright install chromium

# 3. esegui TUTTO come fa la CI
npm run check
```

`npm run check` esegue in sequenza:
- **`npm run verify`** → controlla la sintassi di tutti i blocchi `<script>` del monolite.
- **`npm run test`** → suite Playwright dei flussi critici (boot, moduli, navigazione senza freeze, integrità dati + checkpoint/restore, bundle modulare).

### Comandi singoli
| Comando | Cosa fa |
|---|---|
| `npm run latest` | mostra la versione del monolite più recente |
| `npm run verify` | verifica sintassi del monolite |
| `npm run typecheck` | TypeScript strict sui moduli in `src/` |
| `npm run build` | costruisce il bundle a **file singolo** → `dist/ingly-modules.js` |
| `npm run test` | esegue la suite di test |
| `npm run check` | verify + test (quello che gira in CI) |

### Cosa aspettarsi (output atteso)
```
✅ INGLY-OS-v74-STANDALONE.html — 133 blocchi, 0 errori
...
✅ 7 passati, 0 falliti
```

### CI automatica
Ad ogni **push** o **pull request** parte il workflow `.github/workflows/ci.yml`
che ripete gli stessi passi (verify → typecheck → build → test) su GitHub. Se
qualcosa si rompe, la spunta verde diventa rossa.

---

## Struttura del progetto (Fase 1 — modularizzazione)
```
INGLY-OS-v74-STANDALONE.html   # l'app (monolite offline)
src/                           # moduli TypeScript estratti dal monolite
  core/     globals.ts format.ts        # contratti dati + utility
  modules/  design-system.ts icons.ts audit-log.ts
            machine-invest.ts erp-intel.ts market-hub.ts data-tools.ts
tests/                         # suite di test (harness + spec)
scripts/find-latest.mjs        # risolve la versione più recente
.github/workflows/ci.yml       # pipeline CI
.claude/docs/MODULARIZATION.md # piano di modularizzazione
```

Dettagli sul piano di estrazione: `.claude/docs/MODULARIZATION.md`.
