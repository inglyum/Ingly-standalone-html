# Developer Workflow — INGLY Enterprise

Il loop standard per ogni intervento sul monolite.

```
1. INQUADRA   → cosa serve, quale sezione, tocca logica business? (se sì: chiedi)
2. LOCALIZZA  → grep mirato, identifica il path ATTIVO (attenzione ai doppioni)
3. MODIFICA   → Edit mirate; bulk ripetitivi via script Python/sed
4. VERIFICA   → node .claude/scripts/verify-syntax.mjs  (0 errori obbligatorio)
5. AUDIT      → se toccati prezzi/KPI/finance: skill kb-audit
6. REVIEW     → agent code-reviewer sul diff
7. COMMIT     → atomico, descrittivo, riferimenti (bug id / file KB / sezione)
8. PUSH       → git push -u origin <branch designato>
9. CONSEGNA   → SendUserFile per il test utente
10. DOCUMENTA → aggiorna .claude/docs/DECISIONS.md se scelta architetturale
```

## Principi trasversali
- Verifica, non fiducia. Osserva l'effetto runtime dei cambiamenti nontrivial.
- Non duplicare: cerca prima di creare. Preferisci moduli riutilizzabili.
- Reversibilità: feature che cambiano comportamento = toggle opt-in default-OFF.
- La versione stabile precedente resta intoccata.
