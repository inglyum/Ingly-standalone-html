/* ═══════════════════════════════════════════════════════════════════════════
   INGLY — Audit & Checkpoint (modulo estratto, TypeScript)
   Trail delle scritture (armato dopo il boot) + checkpoint/ripristino dataset
   come undo affidabile a livello di dati. Wrapper NON bloccanti su IDB.put/del.
   Espone window.AuditLog per compatibilità col monolite.
   ═══════════════════════════════════════════════════════════════════════════ */
import { idb, emit } from '../core/globals';

// DS del monolite: qui servono alcuni metodi ricchi (table/modal/confirm) che
// non fanno parte del sottoinsieme tipizzato. Tipizzazione lasca mirata.
interface DSRich {
  button(label: string, opts?: any): HTMLElement;
  badge(label: string, variant?: string): HTMLElement;
  modal(opts: any): { close: () => void };
  table(cols: any[], rows: any[]): HTMLElement;
  confirm(msg: string, opts?: any): Promise<boolean>;
  toast(msg: string, kind?: string, ms?: number): unknown;
}
function ds(): DSRich | undefined { return (window as any).DS; }
function toast(m: string, k?: string): void { try { ds()?.toast(m, k); } catch { /* */ } }

const SKIP: Record<string, 1> = {
  kpi_cache: 1, kpi_snap: 1, scan_history: 1, order_events: 1, audit_log: 1,
  backups: 1, settings: 1, sessions: 1, _meta: 1,
};

export interface TrailEntry { store: string; key: string; op: string; t: number; }
export interface Checkpoint { id: string; _checkpoint: true; label: string; t: number; data: Record<string, any[]>; }

export interface AuditLogApi {
  __v67: true;
  _armed: boolean;
  _suspend: boolean;
  entries(): TrailEntry[];
  record(store: string, key: unknown, op?: string): void;
  checkpoint(label?: string): Promise<Checkpoint | undefined>;
  checkpoints(): Promise<Checkpoint[]>;
  restore(id: string): Promise<void>;
  removeCheckpoint(id: string): Promise<void>;
  panel(): Promise<void>;
}

declare global { interface Window { AuditLog?: AuditLogApi; } }

export function createAuditLog(): AuditLogApi {
  const hist: TrailEntry[] = [];
  const CAP = 200;

  const api: AuditLogApi = {
    __v67: true,
    _armed: false,
    _suspend: false,
    entries() { return hist.slice().reverse(); },
    record(store, key, op = 'write') {
      if (!api._armed || api._suspend || SKIP[store]) return;
      hist.push({ store, key: key != null ? String(key) : '(auto)', op, t: Date.now() });
      if (hist.length > CAP) hist.shift();
    },
    async checkpoint(label) {
      api._suspend = true;
      try {
        const db = idb();
        const data = db?.exportAll ? await db.exportAll() : null;
        if (!data) { toast('Export non disponibile', 'err'); return undefined; }
        const rec: Checkpoint = {
          id: 'chk_' + Date.now(), _checkpoint: true,
          label: label || 'Checkpoint ' + new Date().toLocaleString('it-IT'),
          t: Date.now(), data,
        };
        await db!.put('backups', rec);
        toast('Checkpoint creato', 'ok');
        return rec;
      } catch (e) { toast('Checkpoint fallito', 'err'); return undefined; }
      finally { api._suspend = false; }
    },
    async checkpoints() {
      const all = (await idb()?.getAll('backups').catch(() => [])) || [];
      return (all as any[]).filter((b) => b && b._checkpoint).sort((a, b) => b.t - a.t);
    },
    async restore(id) {
      const db = idb(); if (!db) return;
      const rec = await db.get('backups', id) as Checkpoint | undefined;
      if (!rec || !rec.data) { toast('Checkpoint non trovato', 'err'); return; }
      api._suspend = true; emit('restore:start');
      try {
        for (const sn of Object.keys(rec.data)) {
          const recs = rec.data[sn] || [];
          try { if (db.clearStore) await db.clearStore(sn); } catch { /* */ }
          try {
            if (db.putBulk) await db.putBulk(sn, recs);
            else for (const r of recs) await db.put(sn, r).catch(() => {});
          } catch { /* */ }
        }
        emit('restore:end');
        toast('Dataset ripristinato dal checkpoint', 'ok');
      } catch (e) { toast('Ripristino fallito', 'err'); }
      finally { api._suspend = false; }
    },
    async removeCheckpoint(id) { const db = idb(); if (db?.del) await db.del('backups', id); toast('Checkpoint eliminato', 'ok'); },
    async panel() {
      const D = ds(); if (!D) return;
      const box = document.createElement('div');
      const bar = document.createElement('div'); bar.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap';
      bar.appendChild(D.button('＋ Crea checkpoint', { size: 'sm', variant: 'primary', onclick: () => { api.checkpoint().then(rebuild); } }) as HTMLElement);
      box.appendChild(bar);
      const chkWrap = document.createElement('div'); box.appendChild(chkWrap);
      const rebuild = () => {
        api.checkpoints().then((cks) => {
          chkWrap.textContent = '';
          const cols = [
            { key: 'label', label: 'Checkpoint' },
            { key: 't', label: 'Quando', render: (r: Checkpoint) => new Date(r.t).toLocaleString('it-IT') },
            {
              key: 'act', label: '', render: (r: Checkpoint) => {
                const g = document.createElement('div'); g.style.cssText = 'display:flex;gap:6px';
                g.appendChild(D.button('Ripristina', { size: 'sm', variant: 'primary', onclick: () => {
                  D.confirm('Ripristinare "' + r.label + '"? Lo stato attuale verrà sostituito.', { title: 'Conferma', okLabel: 'Ripristina' })
                    .then((ok) => { if (ok) api.restore(r.id); });
                } }) as HTMLElement);
                g.appendChild(D.button('✕', { size: 'sm', variant: 'ghost', onclick: () => api.removeCheckpoint(r.id).then(rebuild) }) as HTMLElement);
                return g;
              },
            },
          ];
          chkWrap.appendChild(D.table(cols, cks.slice(0, 20)));
        });
      };
      rebuild();
      D.modal({ title: '🧾 Audit & Checkpoint', body: box });
    },
  };
  return api;
}

/** Installa AuditLog + i wrapper non bloccanti su IDB.put/del + arma il trail. */
export function installAuditLog(): AuditLogApi {
  if (typeof window !== 'undefined' && window.AuditLog && window.AuditLog.__v67) return window.AuditLog;
  const api = createAuditLog();
  if (typeof window !== 'undefined') {
    window.AuditLog = api;
    const db = window.IDB as any;
    if (db && !db.__auditWrapped) {
      if (typeof db.put === 'function') {
        const _put = db.put.bind(db);
        db.put = (store: string, rec: any) => { try { api.record(store, rec && (rec.id != null ? rec.id : undefined), 'write'); } catch { /* */ } return _put(store, rec); };
      }
      const delName = typeof db.del === 'function' ? 'del' : (typeof db.remove === 'function' ? 'remove' : null);
      if (delName) {
        const _del = db[delName].bind(db);
        db[delName] = (store: string, key: any) => { try { api.record(store, key, 'delete'); } catch { /* */ } return _del(store, key); };
      }
      db.__auditWrapped = true;
    }
    setTimeout(() => { api._armed = true; }, 6000);
  }
  return api;
}
