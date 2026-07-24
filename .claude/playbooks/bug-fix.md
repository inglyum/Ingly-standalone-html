# Playbook: Bug fix / KB alignment

1. **Riproduci / localizza**: grep mirato del valore o comportamento.
2. **Verifica il path attivo**: alcune funzioni sono duplicate — l'ultima nel
   file vince. Correggi quella ATTIVA, controlla di non toccare dead code.
3. **Controlla la KB**: se è un valore di business, confronta con la skill
   `kb-audit`. Il fix va verso la KB, non verso un'ipotesi.
4. **Applica** con Edit mirata (o script Python per bulk ripetitivi).
5. **Verifica**: `verify-syntax.mjs` → 0 errori.
6. **Commit atomico**: un bug = un commit, con id/riferimento KB.

## Trappole note
- Virgolette annidate in stringhe JS concatenate → escape `\'`.
- f-string Python con backslash → usa assegnazioni fuori dall'espressione.
- Edit fallita "file modified since read" → ri-leggi, non append cieco.
