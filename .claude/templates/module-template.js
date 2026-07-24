/* ═══════════════════════════════════════════════════════════════
   TEMPLATE MODULO INGLY OS — copia e adatta per una nuova sezione.
   Pattern: IIFE che registra un oggetto globale, render on-demand,
   usa IDB per i dati, Bus per gli eventi, CSS var per lo stile.
   ═══════════════════════════════════════════════════════════════ */
;(function ModuleName(){
  'use strict';
  if (window._inglyModuleName) return;      // guard anti-doppia-init
  window._inglyModuleName = true;

  const SK = 'ingly_modulename_v1';           // storage key (versionata)

  const M = window.ModuleName = {
    async render(){
      let el = document.getElementById('view-modulename');
      if (!el){ el = document.createElement('div'); el.id='view-modulename';
        el.className='section-view'; document.getElementById('content-inner')?.appendChild(el); }

      const data = await this._load();

      el.innerHTML = `
        <div class="module-header">
          <div class="module-header-left">
            <div class="module-title">🧩 Nome Modulo</div>
            <div class="module-subtitle">Descrizione breve della sezione</div>
          </div>
          <div class="module-actions">
            <button class="btn btn-primary" onclick="ModuleName._add()">+ Nuovo</button>
          </div>
        </div>
        <div class="grid-3">${data.map(this._card).join('') || this._empty()}</div>`;
    },

    _card(d){
      return `<div class="card">
        <div class="card-title">${d.name}</div>
        <div class="kpi-value">${d.value ?? '—'}</div>
      </div>`;
    },

    _empty(){ return `<div class="card" style="text-align:center;color:var(--text-muted)">Nessun dato — aggiungi il primo elemento</div>`; },

    async _load(){ try { return await IDB.getAll('modulename') || []; } catch { return []; } },

    async _add(){ /* apri modale, valida, IDB.put, Bus.emit, render() */ },
  };

  // Registrazione navigazione (adatta al router del file)
  if (typeof Bus !== 'undefined') Bus.on('nav:modulename', () => M.render());
})();
