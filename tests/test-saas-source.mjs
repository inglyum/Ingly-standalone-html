/* FASE ZERO — Harness di verifica NON distruttivo per i monoliti SaaS target
   (saas-source/INGLY-OS_14.html, saas-source/INGLY-CLOUD-ADMIN_11.html).
   1) SYNTAX: ogni blocco <script> JS deve fare il parse senza SyntaxError.
   2) SECRET-SCAN (guardrail SEC-5): nessun segreto CONDIVISO hardcoded
      (service_role, chiavi segrete provider, chiavi private). Lock dello stato
      verificato-buono: se un segreto viene introdotto in futuro, il test rompe.
   Esce non-zero al primo fallimento. Nessuna modifica ai file. */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFileSync } from 'child_process';

const FILES = [
  'saas-source/INGLY-OS_14.html',
  'saas-source/INGLY-CLOUD-ADMIN_11.html',
];

// Segreti CONDIVISI che non devono MAI comparire come literal nel frontend.
// NB: le chiavi anon Supabase e le chiavi personali in localStorage NON sono qui
// (sono ammesse/documentate: vedi docs/audit/security-findings.md SEC-2/SEC-3).
const SECRET_PATTERNS = [
  { re: /service_role/, label: 'Supabase service_role' },
  { re: /sk-ant-api\d{2}-[A-Za-z0-9_-]{20,}/, label: 'Anthropic secret key' },
  { re: /sk_live_[A-Za-z0-9]{20,}/, label: 'Stripe live secret key' },
  { re: /rk_live_[A-Za-z0-9]{20,}/, label: 'Stripe live restricted key' },
  { re: /AKIA[0-9A-Z]{16}/, label: 'AWS access key id' },
  { re: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/, label: 'PEM private key' },
];

const errors = [];
const tmp = mkdtempSync(join(tmpdir(), 'saas-verify-'));
let totalBlocks = 0;

for (const f of FILES) {
  let html;
  try { html = readFileSync(f, 'utf8'); }
  catch { errors.push(`FILE MANCANTE: ${f}`); continue; }

  // 1) SYNTAX CHECK dei blocchi <script>
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m; let idx = 0;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] || '';
    const code = m[2] || '';
    if (/\bsrc\s*=/.test(attrs)) continue;            // script esterno: nessun corpo
    const typeMatch = attrs.match(/type\s*=\s*["']([^"']+)["']/i);
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'text/javascript';
    const isJs = type === 'text/javascript' || type === 'application/javascript' || type === 'module' || type === '';
    if (!isJs) continue;                               // json/importmap/template: skip
    if (!code.trim()) continue;
    idx++; totalBlocks++;
    const ext = type === 'module' ? 'mjs' : 'js';
    const fp = join(tmp, `blk_${idx}.${ext}`);
    writeFileSync(fp, code);
    try {
      execFileSync(process.execPath, ['--check', fp], { stdio: 'pipe' });
    } catch (e) {
      const msg = (e.stderr ? e.stderr.toString() : e.message).split('\n').slice(0, 3).join(' ');
      errors.push(`SYNTAX ${f} blocco#${idx} (${type}): ${msg}`);
    }
  }

  // 2) SECRET SCAN
  for (const p of SECRET_PATTERNS) {
    if (p.re.test(html)) errors.push(`SECRET ${f}: trovato pattern "${p.label}" — vietato nel frontend`);
  }
}

rmSync(tmp, { recursive: true, force: true });

if (errors.length) {
  console.error('❌ test-saas-source FALLITO:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✅ test-saas-source OK — ${totalBlocks} blocchi <script> parsati, 0 segreti condivisi hardcoded.`);
