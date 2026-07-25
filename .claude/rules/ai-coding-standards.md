# AI Coding Standards — INGLY Enterprise

Standard che ogni contributo (umano o AI) deve rispettare.

## Principi
1. **Non duplicare funzionalità.** Prima di creare, cerca se esiste già (grep).
   Preferisci moduli riutilizzabili (skill, script, componente CSS condiviso).
2. **Modifiche minime e mirate.** Il diff deve leggersi come il codice attorno:
   stessa naming, stessa densità di commenti, stessi idiomi.
3. **Verifica, non fiducia.** Ogni modifica al monolite passa da
   `verify-syntax.mjs`. Ogni cambiamento con effetto runtime va osservato.
4. **Documenta le decisioni.** Ogni scelta architetturale → `.claude/docs/DECISIONS.md`.
5. **Reversibilità.** Le feature che cambiano comportamento sono toggle opt-in,
   default-OFF, finché non approvate.

## Vietato
- `eval`, `new Function` su input dinamico.
- `innerHTML` con dati utente non sanitizzati.
- Cambiare logica di business senza approvazione esplicita.
- Rimuovere store/listener esistenti senza analisi.
- Commit senza syntax check verde.

## Git
- Sviluppo sul branch designato; mai push diretto su default.
- Messaggi di commit descrittivi, in italiano, con riferimento alla causa
  (bug id, file KB, sezione).
- Un commit = un cambiamento coerente.
