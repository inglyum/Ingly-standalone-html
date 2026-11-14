// INGLY OS V2 — Database LOCALE (IndexedDB). Rende il tool INDIPENDENTE e GRATIS:
// nessun server, nessun abbonamento. Implementa lo stesso contratto del client
// Supabase usato dai moduli (.from(t).select/insert/update/delete/eq/is/or/order/
// limit/single/maybeSingle/then), con persistenza nel browser. I dati restano
// sul dispositivo dell'utente (come il v96). Il motore query è puro e testabile;
// la persistenza (IndexedDB) è un backend iniettato.

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
function uid() { return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function nowISO() { return new Date().toISOString(); }

// Numerazione documenti coerente (come il backend): contatori per tenant.
const SEQ = {
  sales_quote: ['PREV', 'quote'], sales_order: ['ORD', 'order'],
  sales_invoice: ['FAT', 'invoice'], purchase_order: ['ACQ', 'po'],
  production_order: ['PRD', 'prod'], shipment: ['SPED', 'ship'],
};

// Applica i default di inserimento (id, timestamp, numerazione, stato iniziale).
function onInsert(store, counters, table, row) {
  if (row.id == null) row.id = uid();
  if (row.deleted_at === undefined) row.deleted_at = null;
  if (row.created_at === undefined) row.created_at = nowISO();
  const seq = SEQ[table];
  if (seq && row.number == null) {
    const key = table + '|' + (row.tenant_id || 't1');
    counters[key] = (counters[key] || (store[table] || []).length) + 1;
    row.number = seq[0] + '-' + String(counters[key]).padStart(6, '0');
  }
  if (table === 'sales_quote' && !row.status) row.status = 'DRAFT';
  if (table === 'sales_order' && !row.status) row.status = 'CONFIRMED';
  return row;
}

// Parser minimale della sintassi .or('col.ilike.%s%,col2.ilike.%s%') (PostgREST).
function orMatcher(expr) {
  const clauses = String(expr || '').split(',').map((c) => {
    const m = c.match(/^([a-z_]+)\.(ilike|eq)\.(.*)$/i);
    if (!m) return () => false;
    const [, col, op, rawVal] = m;
    if (op.toLowerCase() === 'ilike') {
      const needle = rawVal.replace(/%/g, '').toLowerCase();
      return (row) => String(row[col] == null ? '' : row[col]).toLowerCase().includes(needle);
    }
    return (row) => String(row[col]) === rawVal;
  });
  return (row) => clauses.some((f) => f(row));
}

// Costruisce un client con contratto Supabase sopra un `store` in memoria.
// `persist(table)` viene chiamata dopo ogni scrittura (per salvare su IndexedDB).
export function makeClient(store, persist) {
  const counters = {};
  persist = persist || (() => {});

  function builder(table) {
    const st = { table, filters: [], op: 'select', payload: null, orderBy: null, asc: true, lim: null };
    const api = {
      select() { return api; },
      is(c, v) { st.filters.push((row) => row[c] === v || (v === null && row[c] == null)); return api; },
      eq(c, v) { st.filters.push((row) => String(row[c]) === String(v)); return api; },
      or(expr) { const m = orMatcher(expr); st.filters.push(m); return api; },
      order(c, o) { st.orderBy = c; st.asc = !o || o.ascending !== false; return api; },
      limit(n) { st.lim = n; return api; },
      insert(row) { st.op = 'insert'; st.payload = row; return api; },
      update(row) { st.op = 'update'; st.payload = row; return api; },
      delete() { st.op = 'delete'; return api; },
      single() { return Promise.resolve(run(st, 'single')); },
      maybeSingle() { return Promise.resolve(run(st, 'maybe')); },
      then(res, rej) { return Promise.resolve(run(st, 'many')).then(res, rej); },
    };
    return api;
  }

  function run(st, mode) {
    const arr = store[st.table] || (store[st.table] = []);
    if (st.op === 'insert') {
      const rows = Array.isArray(st.payload) ? st.payload : [st.payload];
      const out = rows.map((r) => { const row = onInsert(store, counters, st.table, { ...r }); arr.push(row); return row; });
      persist(st.table);
      return { data: Array.isArray(st.payload) ? out : out[0], error: null };
    }
    if (st.op === 'update') {
      const sel = arr.filter((row) => st.filters.every((f) => f(row)));
      sel.forEach((row) => Object.assign(row, st.payload));
      persist(st.table);
      return { data: sel[0] || null, error: null };
    }
    if (st.op === 'delete') {
      const rem = arr.filter((row) => st.filters.every((f) => f(row)));
      rem.forEach((row) => arr.splice(arr.indexOf(row), 1));
      persist(st.table);
      return { data: null, error: null };
    }
    let rows = arr.filter((row) => st.filters.every((f) => f(row)));
    if (st.orderBy) rows = rows.slice().sort((a, b) => { const x = a[st.orderBy], y = b[st.orderBy]; if (x === y) return 0; return (x > y ? 1 : -1) * (st.asc ? 1 : -1); });
    if (st.lim) rows = rows.slice(0, st.lim);
    if (mode === 'single') return { data: rows[0] || null, error: rows[0] ? null : { message: 'Nessun risultato' } };
    if (mode === 'maybe') return { data: rows[0] || null, error: null };
    return { data: rows, error: null };
  }

  // Auth fittizia locale: un solo utente proprietario, nessun login.
  const auth = {
    async getSession() { return { data: { session: null }, error: null }; },
    async signInWithOtp() { return { data: {}, error: null }; },
    async signOut() { return { error: null }; },
  };

  return { from: builder, auth, _store: store, _r2: r2 };
}

// ── Backend IndexedDB (browser): carica l'intero DB in memoria e lo ripersiste
// dopo ogni scrittura (debounce). I dati vivono SOLO nel browser dell'utente.
const DB_NAME = 'ingly-os-local';
const STORE = 'kv';
const KEY = 'db';

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function idbGet(db, key) {
  return new Promise((resolve) => { try { const tx = db.transaction(STORE, 'readonly'); const rq = tx.objectStore(STORE).get(key); rq.onsuccess = () => resolve(rq.result); rq.onerror = () => resolve(undefined); } catch (_) { resolve(undefined); } });
}
function idbPut(db, key, val) {
  return new Promise((resolve) => { try { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(val, key); tx.oncomplete = () => resolve(true); tx.onerror = () => resolve(false); } catch (_) { resolve(false); } });
}

// Apre il DB locale (IndexedDB) e ritorna un client persistente. seed() è
// chiamata solo al primo avvio (DB vuoto) per dati dimostrativi opzionali.
export async function openLocalDb(seed) {
  let store = {};
  let db = null;
  try {
    db = await idbOpen();
    const saved = await idbGet(db, KEY);
    if (saved && typeof saved === 'object') store = saved;
    else if (typeof seed === 'function') { store = seed() || {}; await idbPut(db, KEY, store); }
  } catch (_) {
    // IndexedDB non disponibile → fallback in memoria (non persistente).
    if (typeof seed === 'function') store = seed() || {};
  }
  let timer = null;
  const persist = () => { if (!db) return; clearTimeout(timer); timer = setTimeout(() => { idbPut(db, KEY, store); }, 150); };
  const client = makeClient(store, persist);
  client._persistNow = () => { if (db) return idbPut(db, KEY, store); };
  client._reset = async () => { store = (typeof seed === 'function' ? seed() : {}) || {}; Object.assign(client._store, {}); for (const k of Object.keys(client._store)) delete client._store[k]; Object.assign(client._store, store); if (db) await idbPut(db, KEY, store); };
  return client;
}
