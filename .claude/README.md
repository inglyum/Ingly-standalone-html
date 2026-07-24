# .claude/ — Ecosistema di sviluppo INGLY Enterprise

Ambiente di sviluppo AI-assistito per il progetto INGLY. Costruito **prima**
dell'applicazione, per garantire velocità, coerenza e qualità enterprise.

## Struttura
```
.claude/
├── agents/       # subagent Claude Code (code-reviewer, ui-polisher, kb-auditor)
├── rules/        # standard: coding, security, ui-ux, ecommerce, perf/a11y
├── skills/       # skill invocabili (single-file-editing, kb-audit, verify-html-build)
├── commands/     # slash command (/verify, /audit-kb, /new-version)
├── templates/    # scaffold riutilizzabili (module-template.js)
├── knowledge/    # architettura e contesto di progetto
├── playbooks/    # procedure operative (release, bug-fix)
├── prompts/      # prompt library (/brain, /prezzo, /audit, /polish, /review)
├── workflows/    # dev loop standard
├── mcp/          # server MCP consigliati per fase
├── docs/         # DECISIONS.md (log) + SKILL_ACQUISITION_REPORT.md (OSINT)
└── scripts/      # verify-syntax.mjs, new-version.sh
```

## Uso rapido
- Verifica build: `node .claude/scripts/verify-syntax.mjs`
- Nuova versione: `bash .claude/scripts/new-version.sh`
- Skill/command disponibili automaticamente in Claude Code.

## Principi
1. Non duplicare — riusa moduli.
2. Verifica, non fiducia — syntax check obbligatorio pre-commit.
3. Documenta ogni decisione in `docs/DECISIONS.md`.
4. Non cambiare logica business senza approvazione.
5. Migliora l'ambiente di sviluppo prima dell'applicazione.
