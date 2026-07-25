#!/usr/bin/env bash
# new-version.sh — crea INGLY-OS-v{N+1} partendo dall'ultima versione.
# Copia il file, bumpa il <title>, verifica la sintassi. Non committa.
#
# Uso: bash .claude/scripts/new-version.sh
set -euo pipefail

latest=$(ls INGLY-OS-v*-STANDALONE.html 2>/dev/null | sed -E 's/.*v([0-9]+).*/\1/' | sort -n | tail -1)
[ -z "${latest:-}" ] && { echo "❌ Nessuna versione trovata"; exit 1; }
next=$((latest + 1))
src="INGLY-OS-v${latest}-STANDALONE.html"
dst="INGLY-OS-v${next}-STANDALONE.html"

cp "$src" "$dst"
# Bump del titolo (unico marcatore di versione canonico)
sed -i "s/INGLY OS v${latest} —/INGLY OS v${next} —/" "$dst"

echo "✅ Creato $dst da $src (titolo → v${next})"
node .claude/scripts/verify-syntax.mjs "$dst"
