#!/usr/bin/env node
/**
 * verify-syntax.mjs — INGLY OS single-file JS syntax checker
 *
 * Estrae ogni blocco <script> dal file HTML standalone e verifica che sia
 * sintatticamente valido usando il parser di Node (--input-type=module).
 * È il gate obbligatorio prima di ogni commit: il file è un monolite da ~100k
 * righe, un solo errore di sintassi rompe l'intera app.
 *
 * Uso:
 *   node .claude/scripts/verify-syntax.mjs INGLY-OS-v49-STANDALONE.html
 *   node .claude/scripts/verify-syntax.mjs            # autodetect ultima versione
 *
 * Exit code 0 = OK, 1 = errori di sintassi trovati.
 */
import { readFileSync, writeFileSync, unlinkSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function autodetect() {
  const files = readdirSync(process.cwd())
    .filter(f => /^INGLY-OS-v\d+-STANDALONE\.html$/.test(f))
    .sort((a, b) => (+a.match(/v(\d+)/)[1]) - (+b.match(/v(\d+)/)[1]));
  return files.at(-1);
}

const target = process.argv[2] || autodetect();
if (!target) { console.error('❌ Nessun file INGLY-OS-vN-STANDALONE.html trovato'); process.exit(1); }

const html = readFileSync(target, 'utf8');
const blocks = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);

let errors = 0;
blocks.forEach((src, i) => {
  const tmp = join(tmpdir(), `ingly-block-${i}-${Date.now()}.mjs`);
  writeFileSync(tmp, src);
  try {
    execFileSync('node', ['--check', '--input-type=module', tmp], { stdio: 'pipe' });
  } catch (e) {
    const msg = (e.stderr?.toString() || e.message).split('\n').slice(0, 3).join('\n');
    if (msg.includes('SyntaxError')) { console.error(`❌ Block ${i}:\n${msg}\n`); errors++; }
  } finally {
    try { unlinkSync(tmp); } catch {}
  }
});

console.log(`\n${errors === 0 ? '✅' : '❌'} ${target} — ${blocks.length} blocchi, ${errors} errori`);
process.exit(errors ? 1 : 0);
