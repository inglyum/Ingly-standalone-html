---
name: verify-html-build
description: Verifica che il file INGLY-OS-vN-STANDALONE.html sia integro dopo una modifica — sintassi JS di tutti i blocchi <script>, bilanciamento CSS, struttura HTML. Usare SEMPRE prima di ogni commit del monolite.
---

# verify-html-build

INGLY OS è un singolo file HTML da ~100k righe. Un errore di sintassi in un
qualsiasi `<script>` rompe l'intera app senza errori evidenti. Questa skill è
il gate di qualità obbligatorio prima di ogni commit.

## Passi

1. **Sintassi JS** — esegui:
   ```bash
   node .claude/scripts/verify-syntax.mjs <file>.html
   ```
   Attesa: `N blocchi, 0 errori`. Se >0, apri il blocco indicato e correggi
   (di solito virgolette annidate non escapate in stringhe JS concatenate).

2. **Bilanciamento CSS** — per ogni blocco `<style>` modificato, verifica che
   il numero di `{` sia uguale a `}`.

3. **Struttura HTML** — conferma che `</head>` sia immediatamente seguito da
   `<body>` e che il numero di `<script>` == `</script>`.

## Regole

- Non committare mai con errori di sintassi.
- Non "verificare rileggendo il file": esegui davvero lo script.
- Se una Edit fallisce con "File modified since read", ri-leggi e riprova —
  non aggirare con append ciechi.
