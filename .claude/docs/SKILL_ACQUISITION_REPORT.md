# Skill Acquisition Report — INGLY Enterprise

Analisi OSINT delle risorse open-source che possono migliorare il progetto.
Punteggi calibrati sul vincolo attuale: **app single-file vanilla JS**, sviluppo
con Claude Code. (Verificato con ricerche reali, luglio 2026.)

## Categorie e risorse valutate

### AI Agents & Claude Code workflow (fit massimo)
| Repo | Autore | URL | Scopo | Priorità | Adottare |
|---|---|---|---|---|---|
| awesome-claude-code-toolkit | rohitg00 | github.com/rohitg00/awesome-claude-code-toolkit | 135 agents, 35 skills, 42 commands, hooks, rules | Alta | Sì (copia selettiva) |
| awesome-claude-code | hesreallyhim | github.com/hesreallyhim/awesome-claude-code | Indice curato di qualità | Alta | Sì (cherry-pick) |
| awesome-claude-code-subagents | VoltAgent | github.com/VoltAgent/awesome-claude-code-subagents | 100+ subagent specializzati | Alta | Sì (copia .md) |
| awesome-claude-skills | travisvn | github.com/travisvn/awesome-claude-skills | Skills (documenti/office utili per preventivi) | Media | Sì |

### MCP Servers
| Repo | URL | Scopo | Priorità |
|---|---|---|---|
| servers (ufficiale) | github.com/modelcontextprotocol/servers | filesystem, fetch, git di riferimento | Alta |
| awesome-mcp-servers | github.com/appcypher/awesome-mcp-servers | directory scoperta | Media |
| stripe/ai | github.com/stripe/ai | pagamenti AI-assisted | Media (se online) |

### Data / Offline-first
| Repo | URL | Scopo | Priorità |
|---|---|---|---|
| Dexie.js | github.com/dexie/Dexie.js | wrapper IndexedDB (query, migrazioni) | Media (a step) |

### Prompt / Context Engineering (migliora la KB interna)
| Repo | URL | Priorità |
|---|---|---|
| Prompt-Engineering-Guide | github.com/dair-ai/prompt-engineering-guide | Media |
| Awesome-Context-Engineering | github.com/Meirtz/Awesome-Context-Engineering | Media |

### Design System / UI (copia token, non componenti React)
| Repo | URL | Priorità |
|---|---|---|
| shadcnspace | github.com/shadcnspace/shadcnspace | Bassa/Media |

### Automazione / Business (a fianco, non pivot)
| Repo | URL | Scopo | Priorità |
|---|---|---|---|
| n8n | github.com/n8n-io/n8n | automazione follow-up/CRM/riordini via webhook | Media |
| Playwright | github.com/microsoft/playwright | smoke test del file in browser reale | Media |

### Ecommerce headless (solo scenario enterprise/pivot)
| Repo | URL | Priorità |
|---|---|---|
| medusa | github.com/medusajs/medusa | Bassa (studio data model) |
| payload | github.com/payloadcms/payload | Bassa |
| erpnext | github.com/frappe/erpnext | Bassa (studio ERP) |

## Roadmap di acquisizione
- **Fase 1 — Essenziali**: ecosistema `.claude/` (fatto), skills/agents di
  review-test-refactor, MCP filesystem/fetch/git.
- **Fase 2 — Professionali**: Dexie (a step), context-engineering sulla KB,
  Playwright per smoke test, n8n sidecar.
- **Fase 3 — Enterprise**: valutazione headless (Medusa/Payload) + Stripe, se e
  quando si apre l'ecommerce reale.
- **Fase 4 — Sperimentali**: multi-agent orchestration, memory systems avanzati.

## Principio
Adottare solo ciò che avvicina agli obiettivi di business (KB golden rule).
Ogni adozione → riga in DECISIONS.md.
