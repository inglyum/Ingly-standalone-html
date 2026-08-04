// Risolve il monolite INGLY-OS più recente (INGLY-OS-vNN-STANDALONE.html).
// Usato da test e CI per non hardcodare la versione.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export function findLatestMonolith(dir = process.cwd()) {
  const re = /^INGLY-OS-v(\d+)-STANDALONE\.html$/;
  let best = null, bestN = -1;
  for (const f of readdirSync(dir)) {
    const m = f.match(re);
    if (m) { const n = +m[1]; if (n > bestN) { bestN = n; best = f; } }
  }
  if (!best) throw new Error('Nessun file INGLY-OS-vNN-STANDALONE.html trovato in ' + dir);
  return { file: best, version: bestN, path: join(dir, best), url: 'file://' + join(dir, best) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = findLatestMonolith();
  console.log(`${r.file} (v${r.version})`);
}
