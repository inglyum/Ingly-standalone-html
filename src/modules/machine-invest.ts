/* ═══════════════════════════════════════════════════════════════════════════
   INGLY — Investimenti & ROI macchine (modulo estratto, TypeScript)
   Payback + accantonamento profit-first sulla scheda equipment (SSOT).
   Espone window.MachineInvest per compatibilità col monolite.
   ═══════════════════════════════════════════════════════════════════════════ */
import { idb, emit } from '../core/globals';
import { eur, num, pct } from '../core/format';

interface DSRich {
  button(label: string, opts?: any): HTMLElement;
  badge(label: string, variant?: string): HTMLElement;
  field(opts?: any): HTMLElement & { _input?: HTMLInputElement };
  modal(opts: any): { close: () => void };
  toast(msg: string, kind?: string): unknown;
}
function ds(): DSRich | undefined { return (window as any).DS; }
function toast(m: string, k?: string): void { try { ds()?.toast(m, k); } catch { /* */ } }

export interface Machine {
  id?: number | string; name?: string; brand?: string; model?: string; tech?: string;
  costBuy?: number; roiMonthly?: number; setAside?: number;
  setAsideLog?: Array<{ date: string; amount: number }>;
  _upd?: number;
}
export interface Metrics {
  cost: number; roiM: number; saved: number; payback: number | null;
  covered: number; suggested: number; remaining: number; etaMonths: number | null;
}
export interface MachineInvestApi {
  __v65: true;
  list(): Promise<Machine[]>;
  metrics(m: Machine): Metrics;
  open(): Promise<void>;
}

declare global { interface Window { MachineInvest?: MachineInvestApi; } }

export function createMachineInvest(): MachineInvestApi {
  async function save(m: Machine, patch: Partial<Machine>): Promise<void> {
    Object.assign(m, patch, { _upd: Date.now() });
    await idb()?.put('equipment', m);
    try { (window as any).AppStore?.invalidate?.('equipment'); } catch { /* */ }
    emit('equipment:changed');
    try { (window as any).MachineHub?.sync?.(); } catch { /* */ }
  }

  const api: MachineInvestApi = {
    __v65: true,
    async list() { return ((await idb()?.getAll('equipment').catch(() => [])) || []) as Machine[]; },
    metrics(m) {
      const cost = num(m.costBuy), roiM = num(m.roiMonthly), saved = num(m.setAside);
      const payback = roiM > 0 && cost > 0 ? Math.ceil(cost / roiM) : null;
      const covered = pct(saved, cost);
      const suggested = roiM > 0 ? Math.round(roiM * 0.15) : 0;
      const remaining = Math.max(0, cost - saved);
      const etaMonths = suggested > 0 && remaining > 0 ? Math.ceil(remaining / suggested) : (remaining <= 0 ? 0 : null);
      return { cost, roiM, saved, payback, covered, suggested, remaining, etaMonths };
    },
    async open() {
      const D = ds(); if (!D) return;
      const rows = await api.list();
      const box = document.createElement('div');
      const intro = document.createElement('p'); intro.className = 'ds-hint'; intro.style.marginBottom = '14px';
      intro.textContent = 'Imposta il margine medio/mese che ogni macchina genera per calcolare il rientro (payback) e accantona una quota verso il suo costo.';
      box.appendChild(intro);
      if (!rows.length) {
        const e = document.createElement('div'); e.className = 'ds-hint';
        e.textContent = 'Nessuna macchina nel parco. Aggiungine dal Catalogo Macchine.';
        box.appendChild(e); D.modal({ title: '📈 Investimenti & ROI', body: box }); return;
      }
      const content = document.createElement('div'); box.appendChild(content);

      const card = (m: Machine): HTMLElement => {
        const k = api.metrics(m);
        const c = document.createElement('div');
        c.style.cssText = 'border:1px solid var(--border,#333);border-radius:var(--radius,12px);padding:14px;margin-bottom:14px;background:var(--bg-card,#161616)';
        const title = document.createElement('div'); title.style.cssText = 'font:700 15px inherit;margin-bottom:4px';
        title.textContent = (m.name || ((m.brand || '') + ' ' + (m.model || '')) || 'Macchina').trim();
        c.appendChild(title);
        const sub = document.createElement('div'); sub.className = 'ds-hint'; sub.style.marginBottom = '10px';
        sub.textContent = (m.tech || '') + ' · Costo ' + eur(k.cost); c.appendChild(sub);
        const mrow = document.createElement('div'); mrow.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px';
        mrow.appendChild(D.badge('Payback: ' + (k.payback != null ? k.payback + ' mesi' : 'imposta margine'), k.payback != null && k.payback <= 18 ? 'green' : 'muted'));
        mrow.appendChild(D.badge('Accantonato: ' + eur(k.saved) + ' (' + k.covered + '%)', k.covered >= 100 ? 'green' : 'muted'));
        if (k.etaMonths != null) mrow.appendChild(D.badge(k.remaining <= 0 ? 'Coperta ✓' : ('Copertura ~' + k.etaMonths + ' mesi'), k.remaining <= 0 ? 'green' : 'muted'));
        c.appendChild(mrow);
        const barBg = document.createElement('div'); barBg.style.cssText = 'height:8px;border-radius:6px;background:var(--border2,#242424);overflow:hidden;margin-bottom:12px';
        const barFill = document.createElement('div'); barFill.style.cssText = 'height:100%;width:' + k.covered + '%;background:var(--primary,#fbbf24)';
        barBg.appendChild(barFill); c.appendChild(barBg);
        const ctr = document.createElement('div'); ctr.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end';
        const roiF = D.field({ label: 'Margine medio/mese (€)', type: 'number', value: k.roiM || '' }); roiF.style.marginBottom = '0'; roiF.style.flex = '1 1 150px';
        roiF._input!.onchange = () => { save(m, { roiMonthly: num(roiF._input!.value) }).then(() => { toast('ROI aggiornato', 'ok'); refresh(); }); };
        ctr.appendChild(roiF);
        const addF = D.field({ label: 'Accantona ora (€)', type: 'number', placeholder: k.suggested ? ('consigliato ' + k.suggested) : '0' }); addF.style.marginBottom = '0'; addF.style.flex = '1 1 130px';
        ctr.appendChild(addF);
        ctr.appendChild(D.button('+ Accantona', { size: 'sm', variant: 'primary', onclick: () => {
          const amt = num(addF._input!.value) || k.suggested; if (amt <= 0) { toast('Importo non valido', 'err'); return; }
          const log = (m.setAsideLog || []).concat([{ date: new Date().toISOString().slice(0, 10), amount: amt }]);
          save(m, { setAside: num(m.setAside) + amt, setAsideLog: log }).then(() => { toast('Accantonati ' + eur(amt), 'ok'); refresh(); });
        } }) as HTMLElement);
        if (k.saved > 0) ctr.appendChild(D.button('Azzera', { size: 'sm', variant: 'ghost', onclick: () => {
          save(m, { setAside: 0, setAsideLog: [] }).then(() => { toast('Accantonamento azzerato', 'ok'); refresh(); });
        } }) as HTMLElement);
        c.appendChild(ctr);
        return c;
      };

      const refresh = () => {
        api.list().then((r) => {
          content.textContent = '';
          let totCost = 0, totSaved = 0, totRoi = 0;
          r.forEach((m) => { const k = api.metrics(m); totCost += k.cost; totSaved += k.saved; totRoi += k.roiM; });
          const sum = document.createElement('div'); sum.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px';
          sum.appendChild(D.badge('Parco: ' + eur(totCost)));
          sum.appendChild(D.badge('Accantonato: ' + eur(totSaved), 'green'));
          sum.appendChild(D.badge('Margine/mese: ' + eur(totRoi)));
          content.appendChild(sum);
          r.forEach((m) => content.appendChild(card(m)));
        });
      };
      refresh();
      D.modal({ title: '📈 Investimenti & ROI', body: box });
    },
  };
  return api;
}

export function installMachineInvest(): MachineInvestApi {
  if (typeof window !== 'undefined' && window.MachineInvest && window.MachineInvest.__v65) return window.MachineInvest;
  const api = createMachineInvest();
  if (typeof window !== 'undefined') window.MachineInvest = api;
  return api;
}
