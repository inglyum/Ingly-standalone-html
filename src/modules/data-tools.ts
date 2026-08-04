/* ═══════════════════════════════════════════════════════════════════════════
   INGLY — DataTools / Personalizzazione totale (modulo estratto, TypeScript)
   Per ogni store: export JSON/CSV, import merge, duplica, archivia, campi custom
   e viste salvate. Espone window.DataTools per compatibilità col monolite.
   ═══════════════════════════════════════════════════════════════════════════ */
import { idb, emit } from '../core/globals';

const DBNAME = 'InglyMasterDB';
const LS_F = 'ingly_customfields_', LS_V = 'ingly_views_';

interface DSRich {
  button(label: string, opts?: any): HTMLElement;
  field(opts?: any): HTMLElement & { _input?: HTMLInputElement | HTMLSelectElement };
  badge(label: string, variant?: string): HTMLElement;
  modal(opts: any): { close: () => void };
  table(cols: any[], rows: any[]): HTMLElement;
  toast(msg: string, kind?: string): unknown;
}
function ds(): DSRich | undefined { return (window as any).DS; }
function toast(m: string, k?: string): void { try { ds()?.toast(m, k); } catch { alert(m); } }
function lsGet<T>(k: string, d: T): T { try { return (JSON.parse(localStorage.getItem(k) as string) as T) || d; } catch { return d; } }
function lsSet(k: string, v: unknown): void { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } }

export interface StoreInfo { name: string; keyPath: string; count: number; }
export interface CustomField { key: string; label: string; type: string; }

export interface DataToolsApi {
  __v64: true;
  stores(): Promise<StoreInfo[]>;
  keyPathOf(store: string): Promise<string>;
  all(store: string): Promise<any[]>;
  exportJSON(store: string): Promise<void>;
  exportCSV(store: string): Promise<void>;
  importFile(store: string): void;
  duplicate(store: string, key: any): Promise<any>;
  setArchived(store: string, key: any, val: boolean): Promise<void>;
  remove(store: string, key: any): Promise<void>;
  fields(store: string): CustomField[];
  saveFields(store: string, arr: CustomField[]): void;
  views(store: string): any[];
  saveViews(store: string, arr: any[]): void;
  hub(): Promise<void>;
  openStore(store: string): Promise<void>;
}

declare global { interface Window { DataTools?: DataToolsApi; } }

export function createDataTools(): DataToolsApi {
  let _dbP: Promise<IDBDatabase> | null = null;
  function db(): Promise<IDBDatabase> {
    if (_dbP) return _dbP;
    _dbP = new Promise((res, rej) => {
      try { const r = indexedDB.open(DBNAME); r.onsuccess = (e) => res((e.target as IDBOpenDBRequest).result); r.onerror = () => rej(r.error); }
      catch (e) { rej(e); }
    });
    return _dbP;
  }
  function download(name: string, text: string, mime = 'application/json'): void {
    try {
      const blob = new Blob([text], { type: mime });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    } catch (e: any) { toast('Export fallito: ' + e.message, 'err'); }
  }
  function csvCell(v: any): string {
    if (v == null) return '';
    if (typeof v === 'object') v = JSON.stringify(v);
    v = String(v);
    return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  const api: DataToolsApi = {
    __v64: true,
    async stores() {
      const d = await db(); const names = Array.prototype.slice.call(d.objectStoreNames) as string[];
      const out: StoreInfo[] = [];
      for (const n of names) {
        let kp: any = 'id', cnt = 0;
        try {
          const os = d.transaction(n, 'readonly').objectStore(n); kp = os.keyPath || 'id';
          cnt = await new Promise<number>((r) => { const rq = os.count(); rq.onsuccess = () => r(rq.result); rq.onerror = () => r(0); });
        } catch { /* */ }
        out.push({ name: n, keyPath: kp, count: cnt });
      }
      return out.sort((a, b) => b.count - a.count);
    },
    async keyPathOf(store) { const d = await db(); try { return (d.transaction(store, 'readonly').objectStore(store).keyPath as string) || 'id'; } catch { return 'id'; } },
    all(store) { return idb()!.getAll(store).catch(() => []); },
    async exportJSON(store) {
      const rows = await api.all(store);
      download('ingly-' + store + '-' + Date.now() + '.json', JSON.stringify({ store, exported: new Date().toISOString(), records: rows }, null, 2));
      toast(rows.length + ' record esportati (JSON)', 'ok');
    },
    async exportCSV(store) {
      const rows = await api.all(store);
      if (!rows.length) { toast('Nessun record', 'info'); return; }
      const colSet: Record<string, 1> = {}; rows.forEach((r) => Object.keys(r).forEach((k) => (colSet[k] = 1)));
      const cols = Object.keys(colSet);
      const lines = [cols.join(';')];
      rows.forEach((r) => lines.push(cols.map((c) => csvCell(r[c])).join(';')));
      download('ingly-' + store + '-' + Date.now() + '.csv', '﻿' + lines.join('\n'), 'text/csv;charset=utf-8');
      toast(rows.length + ' record esportati (CSV)', 'ok');
    },
    importFile(store) {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
      inp.onchange = () => {
        const f = inp.files?.[0]; if (!f) return; const rd = new FileReader();
        rd.onload = async () => {
          try {
            const data = JSON.parse(rd.result as string);
            const recs = Array.isArray(data) ? data : (data.records || []);
            if (!recs.length) { toast('File senza record', 'err'); return; }
            const dbi = idb()!;
            const n = dbi.putBulk ? await dbi.putBulk(store, recs) : (await Promise.all(recs.map((r: any) => dbi.put(store, r)))).length;
            try { (window as any).AppStore?.invalidate?.(store); } catch { /* */ }
            emit(store + ':changed');
            toast((n || recs.length) + ' record importati in ' + store, 'ok');
          } catch (e: any) { toast('Import fallito: ' + e.message, 'err'); }
        };
        rd.readAsText(f);
      };
      inp.click();
    },
    async duplicate(store, key) {
      const kp = await api.keyPathOf(store);
      const rec = await idb()!.get(store, key); if (!rec) { toast('Record non trovato', 'err'); return; }
      const copy = JSON.parse(JSON.stringify(rec));
      if (kp === 'id') delete copy.id; else copy[kp] = copy[kp] + '_copy_' + Date.now();
      if (copy.name) copy.name = copy.name + ' (copia)';
      copy._dup = Date.now();
      await idb()!.put(store, copy); emit(store + ':changed'); toast('Record duplicato', 'ok'); return copy;
    },
    async setArchived(store, key, val) {
      const rec = await idb()!.get(store, key); if (!rec) return;
      rec._archived = !!val; await idb()!.put(store, rec); emit(store + ':changed'); toast(val ? 'Archiviato' : 'Ripristinato', 'ok');
    },
    async remove(store, key) { const d = idb()!; if (d.del) await d.del(store, key); else if (d.remove) await d.remove(store, key); emit(store + ':changed'); toast('Eliminato', 'ok'); },
    fields(store) { return lsGet<CustomField[]>(LS_F + store, []); },
    saveFields(store, arr) { lsSet(LS_F + store, arr || []); },
    views(store) { return lsGet<any[]>(LS_V + store, []); },
    saveViews(store, arr) { lsSet(LS_V + store, arr || []); },
    async hub() {
      const D = ds(); if (!D) return;
      const list = await api.stores();
      const wrap = document.createElement('div');
      const intro = document.createElement('p'); intro.className = 'ds-hint'; intro.style.marginBottom = '12px';
      intro.textContent = 'Gestisci ogni archivio: esporta, importa, duplica, archivia, campi personalizzati e viste salvate.';
      wrap.appendChild(intro);
      const cols = [
        { key: 'name', label: 'Archivio' }, { key: 'count', label: 'Record' },
        { key: 'act', label: '', render: (r: StoreInfo) => D.button('Apri', { size: 'sm', variant: 'ghost', onclick: () => { modal.close(); api.openStore(r.name); } }) },
      ];
      wrap.appendChild(D.table(cols, list));
      const modal = D.modal({ title: '⚙️ Personalizzazione dati', body: wrap });
    },
    async openStore(store) {
      const D = ds(); if (!D) return;
      const rows = await api.all(store); const kp = await api.keyPathOf(store);
      const box = document.createElement('div');
      const bar = document.createElement('div'); bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px';
      bar.appendChild(D.button('Export JSON', { size: 'sm', onclick: () => api.exportJSON(store) }));
      bar.appendChild(D.button('Export CSV', { size: 'sm', onclick: () => api.exportCSV(store) }));
      bar.appendChild(D.button('Importa (merge)', { size: 'sm', variant: 'primary', onclick: () => api.importFile(store) }));
      box.appendChild(bar);
      const rh = document.createElement('div'); rh.style.cssText = 'font:700 13px inherit;margin:6px 0 8px'; rh.textContent = 'Record (' + rows.length + ') — anteprima'; box.appendChild(rh);
      const rcols = [
        { key: kp, label: 'ID', render: (r: any) => String(r[kp] != null ? r[kp] : '') },
        { key: 'name', label: 'Nome', render: (r: any) => r.name || r.title || r.label || r.desc || '—' },
        { key: 'st', label: 'Stato', render: (r: any) => (r._archived ? D.badge('Archiviato', 'red') : D.badge('Attivo', 'green')) },
        { key: 'act', label: '', render: (r: any) => { const g = document.createElement('div'); g.style.cssText = 'display:flex;gap:6px'; g.appendChild(D.button('Duplica', { size: 'sm', variant: 'ghost', onclick: () => api.duplicate(store, r[kp]) })); g.appendChild(D.button(r._archived ? 'Ripristina' : 'Archivia', { size: 'sm', variant: 'ghost', onclick: () => api.setArchived(store, r[kp], !r._archived) })); return g; } },
      ];
      box.appendChild(D.table(rcols, rows.slice(0, 30)));
      D.modal({ title: 'Archivio: ' + store, body: box });
    },
  };
  return api;
}

export function installDataTools(): DataToolsApi {
  if (typeof window !== 'undefined' && window.DataTools && window.DataTools.__v64) return window.DataTools;
  const api = createDataTools();
  if (typeof window !== 'undefined') window.DataTools = api;
  return api;
}
