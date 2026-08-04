/* ═══════════════════════════════════════════════════════════════════════════
   INGLY — Market Hub (modulo estratto, TypeScript)
   Directory fornitori reale (IT/EU/Palermo) + import in 'suppliers' + Ricerca
   Mercato AI (prompt trend/prezzi/idee/marketing) + workflow Hunting.
   Espone window.MarketHub per compatibilità col monolite.
   ═══════════════════════════════════════════════════════════════════════════ */
import { idb, emit } from '../core/globals';

interface DSRich {
  button(label: string, opts?: any): HTMLElement;
  field(opts?: any): HTMLElement & { _input?: HTMLInputElement };
  modal(opts: any): { close: () => void };
  table(cols: any[], rows: any[]): HTMLElement;
  toast(msg: string, kind?: string): unknown;
}
function ds(): DSRich | undefined { return (window as any).DS; }
function toast(m: string, k?: string): void { try { ds()?.toast(m, k); } catch { /* */ } }
function openUrl(u: string): void { try { window.open(u, '_blank', 'noopener'); } catch { /* */ } }
function copy(txt: string): void {
  try { if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(txt); toast('Copiato negli appunti', 'ok'); return; } } catch { /* */ }
  try { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Copiato', 'ok'); } catch { toast('Copia manuale', 'info'); }
}

export interface SupplierItem { name: string; url: string; region: string; type: string; note: string; }
export interface Category { label: string; icon: string; items: SupplierItem[]; }

export const DIR: Record<string, Category> = {
  laser: { label: 'Gadget & grezzi laserabili (legno/metallo/plexi)', icon: '⚡', items: [
    { name: 'Europages — Incisione laser Italia', url: 'https://www.europages.it/aziende/italia/incisione%20laser.html', region: 'IT/EU', type: 'Marketplace B2B', note: 'Directory di produttori/conto-terzi: confronta più fornitori.' },
    { name: 'Premium Business — Gadget in legno', url: 'https://www.premiumbusiness.it/prodotti/category_53/articoli-e-gadget-in-legno.php', region: 'IT', type: 'Grezzi/gadget', note: 'Articoli e gadget in legno personalizzabili.' },
    { name: 'Gadget48', url: 'https://www.gadget48.com/', region: 'IT', type: 'Gadget promozionali', note: 'Ampio catalogo gadget aziendali.' },
    { name: 'EC Laser Studio Store', url: 'https://eclaserstudiostore.com/en/collections/gadget', region: 'IT', type: 'Gadget + vettoriali', note: 'Gadget incisi + disegni vettoriali per laser.' },
  ] },
  subli: { label: 'Sublimazione (tazze, tessili, blanks)', icon: '☕', items: [
    { name: 'Maxilia — Tazze sublimazione', url: 'https://www.maxilia.it/tazze-personalizzate/tazze-per-sublimazione/', region: 'IT/EU', type: 'Blanks', note: 'Da 6 pz, prezzi contenuti.' },
    { name: 'Suvenix — Ingrosso tazze', url: 'https://suvenix.com/it/i-nostri-prodotti/ingrosso-tazze-sublimazione.html', region: 'EU', type: 'Ingrosso', note: 'Produttore EU, prezzi vantaggiosi su volumi.' },
    { name: 'BlueBag Italia', url: 'https://www.bluebagitalia.com/', region: 'IT', type: 'Ingrosso gadget', note: 'Gadget a stock, tazze da ~€0,80.' },
    { name: '2Stamp — Tazze ingrosso', url: 'https://www.2stamp.it/it/per-stampa-sublimatica/', region: 'IT', type: 'Ingrosso', note: 'Coating AA, tra i più economici a volume.' },
    { name: 'HiGift — Tazze sublimazione', url: 'https://www.higift.it/cibo-e-bevande/tazze-tazzine-e-bicchieri/tazze-per-sublimazione-personalizzate', region: 'IT', type: 'Blanks', note: 'Catalogo ampio, spedizione rapida.' },
  ] },
  uv: { label: 'Stampa UV / DTF (consumabili, inchiostri, film)', icon: '🌈', items: [
    { name: 'Burger Print — Consumabili DTF', url: 'https://www.burger-print.it/dtf/consumabili-dtf', region: 'IT', type: 'Consumabili', note: 'Importatore diretto: inchiostri, colla, film PET.' },
    { name: 'DTF Service Stampa — DTF/UV', url: 'https://dtfservicestampa.com/it/consumabili-dtf-uv/', region: 'IT', type: 'Consumabili', note: 'Film DTF-UV, rotoli B-Film.' },
    { name: 'Sublimazione.it — DTF UV', url: 'https://www.sublimazione.it/it/categorie/924-dtf-uv.html', region: 'IT', type: 'Consumabili + macchine', note: 'DTF-UV su pellicola, inchiostro bianco.' },
    { name: 'Europages — Inchiostri UV', url: 'https://www.europages.it/aziende/inchiostri%20uv.html', region: 'EU', type: 'Marketplace B2B', note: 'Fornitori europei di inchiostri UV/digitali.' },
  ] },
  files: { label: 'Risorse file & progetti (SVG/DXF/LBRN)', icon: '🗂️', items: [
    { name: 'Cuttalo — 1000+ progetti free', url: 'https://www.cuttalo.com/en/laser-cut/free-laser-cutting-projects/', region: 'Web', type: 'File gratis', note: 'DXF/SVG/AI, aggiornamenti settimanali.' },
    { name: 'Design Bundles — Laser files', url: 'https://designbundles.net/free-design-resources/free-laser-cutting-files', region: 'Web', type: 'Free + premium', note: 'Compatibili Glowforge, uso commerciale.' },
    { name: 'Vectors File', url: 'https://vectorsfile.com/', region: 'Web', type: 'Free + premium', note: 'Migliaia di file taglio/incisione.' },
  ] },
  palermo: { label: 'Palermo / Sicilia (laboratori & servizi locali)', icon: '📍', items: [
    { name: 'Zincografia La Rosa', url: 'https://www.larosaincisioni.it/', region: 'Palermo', type: 'Servizio/conto terzi', note: 'Dal 2005: marcatura laser metalli, taglio organico.' },
    { name: 'Pinto Ricami — Incisione laser', url: 'https://www.pintoricami.net/incisione-laser', region: 'Palermo', type: 'Servizio', note: 'Incisione su metallo, legno, plexi.' },
    { name: 'Arte Visiva Palermo', url: 'https://www.artevisivapalermo.it/i-servizi/targhe-2/', region: 'Palermo', type: 'Servizio', note: 'Targhe e incisioni, Via Oreto 48.' },
  ] },
};

export function promptTrend(niche: string): string {
  return [
    'Sei un analista di mercato per una micro-impresa artigiana di personalizzazione (laser, UV, DTF, sublimazione, CNC) in Sicilia.',
    'Nicchia: ' + (niche || 'gadget personalizzati incisi'),
    'Elenca 10 TREND di prodotto in forte crescita ORA per questa nicchia (2025-2026), con:',
    '1) prodotto, 2) target/occasione, 3) perché cresce, 4) prezzo di vendita al pubblico €,',
    '5) difficoltà di produzione (1-5), 6) angolo unico per differenziarsi in Sicilia/Italia.',
    'Ordina dal più profittevole. Sii concreto e verificabile.',
  ].join('\n');
}
export function promptPricing(prod: string): string {
  return [
    'Ricerca di mercato del PREZZO per: "' + (prod || 'prodotto') + '".',
    'Dammi prezzo minimo, medio e massimo su Etsy, Amazon Handmade e negozi artigiani italiani;',
    'il prezzo consigliato per un artigiano siciliano di qualità; la marginalità attesa se il costo materiali è basso;',
    'e 3 leve per giustificare un prezzo più alto. Valori in €, in tabella.',
  ].join('\n');
}
export function promptIdeas(base: string): string {
  return [
    'Genera 12 IDEE di prodotto personalizzato vendibili, partendo da: "' + (base || 'legno inciso a laser') + '".',
    'Per ognuna: nome, occasione/target, tecnica, materiali, prezzo di vendita €, e una frase marketing.',
    'Privilegia idee stagionali e regali personalizzati ad alto margine.',
  ].join('\n');
}
export function promptMarketing(prod: string): string {
  return [
    'Crea una STRATEGIA marketing per vendere: "' + (prod || 'prodotto') + '" come artigiano siciliano.',
    'Includi: posizionamento/USP, 3 canali prioritari, 5 idee contenuto IG/TikTok, offerta di lancio,',
    'script breve per WhatsApp/DM, 3 keyword/hashtag locali. Concreto e azionabile.',
  ].join('\n');
}
export function huntLinks(q: string): Array<{ label: string; url: string }> {
  const e = encodeURIComponent(q || 'gadget personalizzato');
  return [
    { label: 'Etsy', url: 'https://www.etsy.com/search?q=' + e },
    { label: 'Amazon Handmade', url: 'https://www.amazon.it/s?k=' + e },
    { label: 'AliExpress (costi)', url: 'https://it.aliexpress.com/wholesale?SearchText=' + e },
    { label: 'Google Trends', url: 'https://trends.google.it/trends/explore?q=' + e + '&geo=IT' },
    { label: 'Pinterest (ispirazione)', url: 'https://www.pinterest.it/search/pins/?q=' + e },
    { label: 'Google Shopping', url: 'https://www.google.com/search?tbm=shop&q=' + e },
  ];
}

export interface MarketHubApi {
  __v69: true;
  DIR: typeof DIR;
  importSupplier(it: SupplierItem, cat: string): Promise<void>;
  importCategory(cat: string): Promise<void>;
  open(tab?: string): void;
}

declare global { interface Window { MarketHub?: MarketHubApi; } }

export function createMarketHub(): MarketHubApi {
  const api: MarketHubApi = {
    __v69: true,
    DIR,
    async importSupplier(it, cat) {
      const rec = {
        id: 'mh_' + Date.now() + '_' + Math.floor(Math.random() * 999),
        name: it.name, contact: it.url, material: DIR[cat] ? DIR[cat].label : '',
        url: it.url, category: cat, region: it.region, type: it.type, note: it.note,
        _source: 'MarketHub', createdAt: new Date().toISOString(),
      };
      await idb()?.put('suppliers', rec).catch(() => {});
      emit('suppliers:changed');
      toast('Fornitore importato: ' + it.name, 'ok');
    },
    async importCategory(cat) {
      const d = DIR[cat]; if (!d) return;
      for (const it of d.items) await api.importSupplier(it, cat);
      toast(d.items.length + ' fornitori importati in "' + d.label + '"', 'ok');
    },
    open(tab) {
      const D = ds(); if (!D) return;
      const box = document.createElement('div');
      const tabs = document.createElement('div'); tabs.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;border-bottom:1px solid var(--border,#333);padding-bottom:10px';
      const body = document.createElement('div');
      const TABS: Array<[string, string]> = [['dir', '🏭 Fornitori'], ['research', '🔎 Ricerca Mercato'], ['hunt', '🎯 Hunting']];
      const setTab = (id: string) => {
        body.textContent = '';
        Array.from(tabs.children).forEach((b) => (b as HTMLElement).classList.toggle('ds-btn--primary', (b as HTMLElement).dataset.t === id));
        if (id === 'dir') renderDir(); else if (id === 'research') renderResearch(); else renderHunt();
      };
      TABS.forEach((t) => { const b = D.button(t[1], { size: 'sm', variant: 'ghost' }); (b as HTMLElement).dataset.t = t[0]; (b as HTMLElement).onclick = () => setTab(t[0]); tabs.appendChild(b); });
      box.appendChild(tabs); box.appendChild(body);

      const renderDir = () => {
        const intro = document.createElement('p'); intro.className = 'ds-hint'; intro.style.marginBottom = '12px';
        intro.textContent = 'Punti di partenza verificati (IT/EU + Palermo). Prezzi e recensioni vanno confermati: usa "Ricerca Mercato".';
        body.appendChild(intro);
        Object.keys(DIR).forEach((cat) => {
          const d = DIR[cat];
          const sec = document.createElement('div'); sec.style.cssText = 'margin-bottom:18px';
          const h = document.createElement('div'); h.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px';
          const ht = document.createElement('div'); ht.style.cssText = 'font:700 14px inherit'; ht.textContent = d.icon + ' ' + d.label; h.appendChild(ht);
          h.appendChild(D.button('Importa tutti', { size: 'sm', variant: 'ghost', onclick: () => api.importCategory(cat) }));
          sec.appendChild(h);
          const cols = [
            { key: 'name', label: 'Fornitore', render: (r: SupplierItem) => { const a = document.createElement('a'); a.textContent = r.name; a.href = r.url; a.target = '_blank'; a.rel = 'noopener'; a.style.color = 'var(--primary,#fbbf24)'; a.style.textDecoration = 'none'; return a; } },
            { key: 'region', label: 'Area' }, { key: 'type', label: 'Tipo' },
            { key: 'act', label: '', render: (r: SupplierItem) => { const g = document.createElement('div'); g.style.cssText = 'display:flex;gap:6px'; g.appendChild(D.button('Apri', { size: 'sm', variant: 'ghost', onclick: () => openUrl(r.url) })); g.appendChild(D.button('+ Importa', { size: 'sm', variant: 'primary', onclick: () => api.importSupplier(r, cat) })); return g; } },
          ];
          sec.appendChild(D.table(cols, d.items));
          body.appendChild(sec);
        });
      };
      const promptCard = (title: string, text: string): HTMLElement => {
        const c = document.createElement('div'); c.style.cssText = 'border:1px solid var(--border,#333);border-radius:12px;padding:12px;margin-bottom:12px;background:var(--bg-card,#161616)';
        const h = document.createElement('div'); h.style.cssText = 'font:700 13px inherit;margin-bottom:8px'; h.textContent = title; c.appendChild(h);
        const pre = document.createElement('div'); pre.style.cssText = 'font:400 12px/1.5 inherit;color:var(--text-muted,#9ca3af);white-space:pre-wrap;background:var(--bg-card2,#111);border:1px solid var(--border2,#242424);border-radius:8px;padding:10px;margin-bottom:8px;max-height:150px;overflow:auto'; pre.textContent = text; c.appendChild(pre);
        const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px';
        row.appendChild(D.button('Copia prompt', { size: 'sm', variant: 'primary', onclick: () => copy(text) }));
        row.appendChild(D.button('Apri AI', { size: 'sm', variant: 'ghost', onclick: () => { try { (window as any).App?.navigate('ai'); } catch { /* */ } } }));
        c.appendChild(row); return c;
      };
      const renderResearch = () => {
        const f = D.field({ label: 'Prodotto / nicchia da analizzare', placeholder: 'es. portachiavi in legno inciso' }); f._input!.value = 'portachiavi in legno inciso'; body.appendChild(f);
        const out = document.createElement('div');
        const build = () => { const q = f._input!.value.trim() || 'gadget personalizzato'; out.textContent = ''; out.appendChild(promptCard('📈 Trend di mercato', promptTrend(q))); out.appendChild(promptCard('💶 Prezzi di mercato', promptPricing(q))); out.appendChild(promptCard('💡 Idee prodotto', promptIdeas(q))); out.appendChild(promptCard('📣 Strategia marketing', promptMarketing(q))); };
        const gen = D.button('Genera prompt', { variant: 'primary', onclick: build }); gen.style.margin = '0 0 14px'; body.appendChild(gen); body.appendChild(out); build();
      };
      const renderHunt = () => {
        const intro = document.createElement('p'); intro.className = 'ds-hint'; intro.style.marginBottom = '12px'; intro.textContent = 'Definisci la nicchia, apri i mercati con la query pre-compilata, raccogli prezzi e margini, decidi.'; body.appendChild(intro);
        const f = D.field({ label: 'Parola chiave prodotto', placeholder: 'es. regalo personalizzato battesimo' }); f._input!.value = 'regalo personalizzato'; body.appendChild(f);
        const linksWrap = document.createElement('div'); linksWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
        const rebuild = () => { linksWrap.textContent = ''; huntLinks(f._input!.value.trim()).forEach((l) => linksWrap.appendChild(D.button(l.label, { size: 'sm', variant: 'ghost', onclick: () => openUrl(l.url) }))); };
        f._input!.oninput = rebuild; rebuild();
        const lh = document.createElement('div'); lh.style.cssText = 'font:700 13px inherit;margin:10px 0 8px'; lh.textContent = 'Apri i mercati (query pre-compilata)'; body.appendChild(lh); body.appendChild(linksWrap);
      };

      D.modal({ title: '🛰️ Market Hub — Fornitori & Ricerca', body: box });
      setTab(tab || 'dir');
    },
  };
  return api;
}

export function installMarketHub(): MarketHubApi {
  if (typeof window !== 'undefined' && window.MarketHub && window.MarketHub.__v69) return window.MarketHub;
  const api = createMarketHub();
  if (typeof window !== 'undefined') window.MarketHub = api;
  return api;
}
