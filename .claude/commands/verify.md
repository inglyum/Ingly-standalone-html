---
description: Verifica l'integrità del monolite INGLY OS (sintassi JS di tutti gli <script>). Da eseguire prima di ogni commit.
---

Esegui il gate di qualità sul file dell'app:

```bash
node .claude/scripts/verify-syntax.mjs
```

Se ci sono errori, apri il blocco indicato, correggi (causa tipica: virgolette
annidate non escapate in stringhe JS concatenate) e ri-esegui finché è verde.
Riporta il risultato: numero di blocchi e numero di errori. Non procedere al
commit se non è `0 errori`.
