/* ═══════════════════════════════════════════════════════════════════════════
   INGLY — Design System (modulo estratto, TypeScript)
   Proof-of-concept della modularizzazione strangler-fig: il DS che nel monolite
   è iniettato come <script> qui è un modulo tipizzato, testabile e buildabile.
   Espone la stessa API `window.DS` per compatibilità 1:1 con il monolite.
   ═══════════════════════════════════════════════════════════════════════════ */

export type ToastKind = 'ok' | 'err' | 'info';
export interface ButtonOpts {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'lg';
  icon?: string;
  onclick?: () => void;
  disabled?: boolean;
  title?: string;
}
export interface FieldOpts {
  label?: string;
  id?: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea' | string;
  value?: string | number;
  placeholder?: string;
  hint?: string;
  options?: Array<{ value: string; label: string } | string>;
  oninput?: (e: Event) => void;
  onchange?: (e: Event) => void;
}
export interface ModalOpts { title?: string; body?: string | Node; footer?: HTMLElement[]; onClose?: () => void; }
export interface DSApi {
  __v63: true;
  button(label: string, opts?: ButtonOpts): HTMLButtonElement;
  field(opts?: FieldOpts): HTMLElement & { _input?: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement };
  badge(label: string, variant?: string): HTMLSpanElement;
  modal(opts?: ModalOpts): { el: HTMLElement; body: HTMLElement; close: () => void };
  toast(msg: string, kind?: ToastKind, ms?: number): HTMLElement;
}

const CSS = `
.ds-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font:600 14px/1 inherit;padding:10px 16px;min-height:40px;border-radius:var(--radius,12px);border:1px solid transparent;background:var(--bg-card,#1a1a1a);color:var(--text,#fff);cursor:pointer;transition:transform .12s var(--ease-out,ease),box-shadow .12s ease,background .12s ease;white-space:nowrap}
.ds-btn:hover{transform:translateY(-1px);box-shadow:var(--shadow-md,0 4px 12px rgba(0,0,0,.2))}
.ds-btn:focus-visible{outline:2px solid var(--primary,#fbbf24);outline-offset:2px}
.ds-btn--primary{background:var(--primary,#fbbf24);color:#1a1200;border-color:var(--primary,#fbbf24)}
.ds-btn--ghost{background:transparent;border-color:var(--border,#333)}
.ds-btn--sm{min-height:32px;padding:6px 12px;font-size:13px}
.ds-badge{display:inline-flex;align-items:center;gap:5px;font:600 11px/1 inherit;padding:5px 9px;border-radius:999px;background:color-mix(in srgb,var(--primary,#fbbf24) 15%,transparent);color:var(--primary,#fbbf24)}
`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, txt?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
}

export function createDesignSystem(): DSApi {
  if (!document.getElementById('ds-styles-mod')) {
    const st = el('style'); st.id = 'ds-styles-mod'; st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  const DS: DSApi = {
    __v63: true,
    button(label, opts = {}) {
      const b = el('button', 'ds-btn' + (opts.variant ? ' ds-btn--' + opts.variant : '') + (opts.size ? ' ds-btn--' + opts.size : ''));
      if (opts.icon) { const i = el('span', undefined, opts.icon); i.setAttribute('aria-hidden', 'true'); b.appendChild(i); }
      b.appendChild(document.createTextNode(label || ''));
      if (opts.onclick) b.onclick = opts.onclick;
      if (opts.disabled) b.disabled = true;
      if (opts.title) b.title = opts.title;
      return b;
    },
    field(opts = {}) {
      const f = el('div', 'ds-field') as HTMLElement & { _input?: any };
      if (opts.label) { const l = el('label', 'ds-label', opts.label); if (opts.id) l.htmlFor = opts.id; f.appendChild(l); }
      let input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (opts.type === 'select') {
        const sel = el('select', 'ds-select');
        (opts.options || []).forEach((o) => {
          const isObj = typeof o === 'object';
          const op = el('option', undefined, isObj ? (o as any).label : String(o));
          op.value = isObj ? (o as any).value : String(o); sel.appendChild(op);
        });
        if (opts.value != null) sel.value = String(opts.value);
        input = sel;
      } else if (opts.type === 'textarea') {
        input = el('textarea', 'ds-textarea'); if (opts.value != null) input.value = String(opts.value);
      } else {
        const inp = el('input', 'ds-input'); inp.type = opts.type || 'text';
        if (opts.value != null) inp.value = String(opts.value);
        if (opts.placeholder) inp.placeholder = opts.placeholder;
        input = inp;
      }
      if (opts.id) input.id = opts.id;
      if (opts.oninput) input.oninput = opts.oninput;
      if (opts.onchange) input.onchange = opts.onchange;
      f.appendChild(input);
      if (opts.hint) f.appendChild(el('div', 'ds-hint', opts.hint));
      f._input = input;
      return f;
    },
    badge(label, variant) { return el('span', 'ds-badge' + (variant ? ' ds-badge--' + variant : ''), label); },
    modal(opts = {}) {
      const ov = el('div', 'ds-modal-ov'); const m = el('div', 'ds-modal');
      const hd = el('div', 'ds-modal-hd'); hd.appendChild(el('h3', undefined, opts.title || ''));
      const x = el('button', 'ds-modal-x', '×'); x.setAttribute('aria-label', 'Chiudi'); hd.appendChild(x);
      const bd = el('div', 'ds-modal-bd');
      if (typeof opts.body === 'string') bd.textContent = opts.body; else if (opts.body) bd.appendChild(opts.body);
      m.appendChild(hd); m.appendChild(bd);
      const api = { el: ov, body: bd, close: () => { if (ov.parentNode) ov.parentNode.removeChild(ov); opts.onClose?.(); } };
      x.onclick = api.close;
      ov.addEventListener('click', (e) => { if (e.target === ov) api.close(); });
      ov.appendChild(m); document.body.appendChild(ov);
      return api;
    },
    toast(msg, kind = 'info', ms = 3200) {
      let wrap = document.getElementById('ds-toast-wrap');
      if (!wrap) { wrap = el('div', 'ds-toast-wrap'); wrap.id = 'ds-toast-wrap'; document.body.appendChild(wrap); }
      const t = el('div', 'ds-toast ds-toast--' + kind); t.appendChild(el('span', undefined, msg));
      wrap.appendChild(t);
      setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, ms);
      return t;
    },
  };
  return DS;
}

// Compatibilità con il monolite: espone window.DS se non già presente.
declare global { interface Window { DS?: DSApi; } }
export function installDesignSystem(): DSApi {
  if (typeof window !== 'undefined') {
    if (window.DS && window.DS.__v63) return window.DS;
    const DS = createDesignSystem();
    window.DS = DS;
    return DS;
  }
  return createDesignSystem();
}
