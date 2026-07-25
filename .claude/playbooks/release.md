# Playbook: Release di una nuova versione

1. **Nuova versione**: `bash .claude/scripts/new-version.sh` (crea vN+1, bump title).
2. **Applica le modifiche** sulla nuova versione (mai sulla precedente stabile).
3. **Verifica build**: `node .claude/scripts/verify-syntax.mjs` → 0 errori.
4. **Audit KB** se hai toccato quoter/KPI/finance: skill `kb-audit`.
5. **Code review**: agent `code-reviewer` sul diff.
6. **Commit** descrittivo (tema della versione, riferimenti KB/bug).
7. **Push** sul branch designato: `git push -u origin <branch>`.
8. **Consegna** il file all'utente per il test (SendUserFile).
9. **Changelog**: annota in `.claude/docs/DECISIONS.md` cosa cambia e perché.

## Regola
La versione precedente resta INTOCCATA (rollback sempre possibile). Le feature
che cambiano calcoli sono opt-in default-OFF finché non approvate.
