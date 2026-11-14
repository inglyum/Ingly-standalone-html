// INGLY OS V2 — build del TOOL STANDALONE reale (offline, locale, gratis).
// Genera app-v2/ingly-os-standalone.html: unico file HTML apribile col doppio
// click (file://), senza server, con dati salvati in IndexedDB. Inlinea i moduli
// ES di app-v2/src (bundle esbuild) e styles.css in standalone.html.
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(ROOT, 'app-v2');
const OUT = join(APP, 'ingly-os-standalone.html');
const ESBUILD = join(ROOT, 'node_modules', '.bin', 'esbuild');

const html = readFileSync(join(APP, 'standalone.html'), 'utf8');
const m = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (!m) throw new Error('Blocco <script type="module"> non trovato in standalone.html');

const entry = join(APP, '__standalone_real_entry.tmp.js');
writeFileSync(entry, m[1]);
try {
  execFileSync(ESBUILD, [entry, '--bundle', '--format=iife', '--platform=browser', '--outfile=' + entry + '.out.js'], { stdio: 'inherit' });
} finally {
  try { unlinkSync(entry); } catch (_) { /* noop */ }
}
const bundle = readFileSync(entry + '.out.js', 'utf8');
unlinkSync(entry + '.out.js');
const css = readFileSync(join(APP, 'src', 'styles.css'), 'utf8');

const out = html
  .replace(/<link rel="stylesheet" href="\.\/src\/styles\.css">/, `<style>\n${css}\n</style>`)
  .replace(/<script type="module">[\s\S]*?<\/script>/, `<script>\n${bundle}\n</script>`);
writeFileSync(OUT, out);
console.log(`✅ Tool standalone: ${OUT} (${(out.length / 1024).toFixed(0)} KB) — aprilo col doppio click, dati salvati in locale.`);
