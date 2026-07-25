---
description: Crea la versione successiva del monolite (vN → vN+1), bumpa il titolo e verifica la sintassi.
---

Esegui:

```bash
bash .claude/scripts/new-version.sh
```

Lo script copia l'ultima `INGLY-OS-vN-STANDALONE.html` in `vN+1`, aggiorna il
`<title>` e lancia il syntax check. Non committa: dopo, applica le modifiche
previste sulla nuova versione, ri-verifica e committa con un messaggio che
descrive il tema della nuova versione.
