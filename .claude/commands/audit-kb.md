---
description: Audita una sezione del tool contro la INGLY-OS Knowledge Base e segnala i valori di business divergenti.
argument-hint: [nome-sezione]
---

Attiva la skill `kb-audit` sulla sezione indicata in `$ARGUMENTS` (o su tutto il
file se vuota).

1. Estrai i valori hardcoded di business (prezzi, %, soglie, giorni, markup, labor).
2. Confrontali con i valori canonici della skill `kb-audit`.
3. Produci una tabella: attuale → KB → verdetto (OK/DIVERGE) → riga.
4. Per le divergenze, proponi il fix 1:1 verso la KB. Non alterare logica
   business oltre l'allineamento senza chiedere.
5. Chiudi con le 3 divergenze più impattanti su margine/cassa.
