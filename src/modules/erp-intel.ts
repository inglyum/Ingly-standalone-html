/* ═══════════════════════════════════════════════════════════════════════════
   INGLY — Home ERP Intelligence (modulo estratto, TypeScript)
   Briefing sulla Dashboard: legge ordini/magazzino/macchine/ricavi settimana e
   sintetizza stato + prossime azioni (KPI KB: settimana ≥ €375). Solo lettura.
   Espone window.ERPIntel per compatibilità col monolite.
   ═══════════════════════════════════════════════════════════════════════════ */
import { idb, bus } from '../core/globals';
import { eur, num } from '../core/format';

const TARGET_WEEK = 375;

function getAll(store: string): Promise<any[]> {
  const db = idb();
  return db ? db.getAll(store).catch(() => []) : Promise.resolve([]);
}
function field(o: Record<string, any>, keys: string[], d?: any): any {
  for (const k of keys) if (o[k] != null) return o[k];
  return d;
}
function ts(o: Record<string, any>): number {
  const v = field(o, ['createdAt', 'date', '_upd', 'ts', 'created'], 0);
  const t = typeof v === 'number' ? v : Date.parse(v);
  return Number.isFinite(t) ? t : 0;
}

export interface IntelData {
  weekRev: number; weekCount: number; pending: number; quotesTot: number;
  low: string[]; notPaid: Array<{ name: string; pct: number }>;
  target: number; onTrack: boolean;
}
export interface ERPIntelApi {
  __v66: true;
  compute(): Promise<IntelData>;
  actions(d: IntelData): string[];
  render(): Promise<void>;
}

declare global { interface Window { ERPIntel?: ERPIntelApi; } }

export function createERPIntel(): ERPIntelApi {
  const api: ERPIntelApi = {
    __v66: true,
    async compute() {
      const orders = await getAll('orders');
      const equip = await getAll('equipment');
      let inv = await getAll('inventory'); if (!inv.length) inv = await getAll('materials');
      const now = Date.now(), weekAgo = now - 7 * 864e5;
      const CLOSED = ['completato', 'venduto', 'paid', 'delivered', 'sold', 'invoiced', 'completed'];
      let weekRev = 0, weekCount = 0, pending = 0, quotesTot = 0;
      orders.forEach((o) => {
        const st = String(field(o, ['status', 'stage'], '')).toLowerCase();
        const tot = num(field(o, ['total', 'amount', 'price', 'totale', 'importo'], 0));
        if (CLOSED.indexOf(st) >= 0 && ts(o) >= weekAgo) { weekRev += tot; weekCount++; }
        if (['preventivo', 'inviato', 'sent', 'draft', 'accettato', 'accepted'].indexOf(st) >= 0) { pending++; quotesTot += tot; }
      });
      const low: string[] = [];
      inv.forEach((i) => {
        const q = num(field(i, ['qty', 'quantita', 'stock', 'giacenza'], NaN));
        const min = num(field(i, ['min', 'minStock', 'soglia', 'scortaMin'], NaN));
        if (Number.isFinite(q) && Number.isFinite(min) && min > 0 && q <= min) low.push(field(i, ['name', 'nome', 'label'], '—'));
      });
      const notPaid: Array<{ name: string; pct: number }> = [];
      equip.forEach((m) => {
        const cost = num(m.costBuy), saved = num(m.setAside);
        if (cost > 0 && saved < cost) notPaid.push({ name: (m.name || ((m.brand || '') + ' ' + (m.model || ''))).trim() || 'Macchina', pct: Math.round((saved / cost) * 100) });
      });
      return { weekRev, weekCount, pending, quotesTot, low, notPaid, target: TARGET_WEEK, onTrack: weekRev >= TARGET_WEEK };
    },
    actions(d) {
      const a: string[] = [];
      if (!d.onTrack) a.push('Mancano ' + eur(d.target - d.weekRev) + ' al target settimanale (' + eur(d.target) + '): spingi 1-2 preventivi a chiusura.');
      if (d.pending > 0) a.push(d.pending + ' preventivi aperti (' + eur(d.quotesTot) + ' potenziali): ricontatta chi non risponde da 3+ giorni.');
      if (d.low.length) a.push('Riordina materiali sotto scorta: ' + d.low.slice(0, 4).join(', ') + (d.low.length > 4 ? '…' : '') + '.');
      if (d.notPaid.length) a.push(d.notPaid.length + ' macchine non ancora ripagate: accantona la quota mensile (Investimenti & ROI).');
      if (!a.length) a.push('Tutto in linea. Consolida: eventi ricorrenti e clienti B2B ripetuti.');
      return a;
    },
    async render() {
      const host = document.getElementById('view-dashboard'); if (!host) return;
      let mount = host.querySelector('#erp-intel-panel') as HTMLElement | null;
      if (!mount) {
        mount = document.createElement('div'); mount.id = 'erp-intel-panel'; mount.style.cssText = 'margin:0 0 18px';
        const hdr = host.querySelector('.module-header');
        if (hdr && hdr.nextSibling) hdr.parentNode!.insertBefore(mount, hdr.nextSibling);
        else host.insertBefore(mount, host.firstChild);
      }
      mount.textContent = '';
      const d = await api.compute();
      const panel = document.createElement('div');
      panel.style.cssText = 'border:1px solid var(--border,#333);border-radius:var(--radius-lg,16px);padding:18px;background:linear-gradient(135deg,color-mix(in srgb,var(--primary,#fbbf24) 8%,var(--bg-card,#161616)),var(--bg-card,#161616))';
      const top = document.createElement('div'); top.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap';
      const t = document.createElement('div'); t.style.cssText = 'font:800 18px inherit'; t.textContent = '🧠 Intelligence — briefing di oggi'; top.appendChild(t);
      const D = (window as any).DS;
      if (D?.badge) top.appendChild(D.badge(d.onTrack ? 'In linea col target' : 'Sotto target', d.onTrack ? 'green' : 'red'));
      panel.appendChild(top);
      const strip = document.createElement('div'); strip.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px';
      const kpi = (label: string, val: string | number, sub?: string): HTMLElement => {
        const c = document.createElement('div'); c.style.cssText = 'background:var(--bg-card,#111);border:1px solid var(--border,#333);border-radius:var(--radius,12px);padding:12px';
        const v = document.createElement('div'); v.style.cssText = 'font:800 20px inherit;color:var(--primary,#fbbf24)'; v.textContent = String(val);
        const l = document.createElement('div'); l.className = 'ds-hint'; l.style.marginTop = '4px'; l.textContent = label;
        c.appendChild(v); c.appendChild(l);
        if (sub) { const s = document.createElement('div'); s.className = 'ds-hint'; s.textContent = sub; c.appendChild(s); }
        return c;
      };
      strip.appendChild(kpi('Ricavi settimana', eur(d.weekRev), 'target ' + eur(d.target)));
      strip.appendChild(kpi('Ordini chiusi (7g)', d.weekCount));
      strip.appendChild(kpi('Preventivi aperti', d.pending, eur(d.quotesTot) + ' potenziali'));
      strip.appendChild(kpi('Sotto scorta', d.low.length + ' art.'));
      panel.appendChild(strip);
      const ah = document.createElement('div'); ah.style.cssText = 'font:700 13px inherit;margin-bottom:8px'; ah.textContent = 'Prossime azioni'; panel.appendChild(ah);
      const ul = document.createElement('div'); ul.style.cssText = 'display:flex;flex-direction:column;gap:8px';
      api.actions(d).forEach((txt) => {
        const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.4';
        const dot = document.createElement('span'); dot.textContent = '→'; dot.style.color = 'var(--primary,#fbbf24)'; dot.setAttribute('aria-hidden', 'true');
        const sp = document.createElement('span'); sp.textContent = txt;
        row.appendChild(dot); row.appendChild(sp); ul.appendChild(row);
      });
      panel.appendChild(ul);
      mount.appendChild(panel);
    },
  };
  return api;
}

export function installERPIntel(): ERPIntelApi {
  if (typeof window !== 'undefined' && window.ERPIntel && window.ERPIntel.__v66) return window.ERPIntel;
  const api = createERPIntel();
  if (typeof window !== 'undefined') {
    window.ERPIntel = api;
    try {
      const b = bus();
      b?.on('nav:dashboard', () => setTimeout(() => api.render(), 350));
      ['orders:changed', 'equipment:changed', 'inventory:changed'].forEach((ev) => b?.on(ev, () => api.render()));
    } catch { /* */ }
  }
  return api;
}
