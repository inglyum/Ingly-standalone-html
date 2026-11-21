/* INGLY OS v68 — fallback PDF di stampa + autodiagnostica non distruttiva */
(function(root,doc){
 'use strict';
 if(root.INGLYDocsV68)return;
 const clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const amount=n=>{const x=Number(n);return Number.isFinite(x)?x.toLocaleString('it-IT',{style:'currency',currency:'EUR'}):'—';};
 function printSale(s,cfg){
   if(!doc?.body){if(typeof root.toast==='function')root.toast('Anteprima non disponibile','error');return false;}
   doc.getElementById('ingly-v68-print-dialog')?.remove();
   const pane=doc.createElement('div');pane.id='ingly-v68-print-dialog';pane.setAttribute('role','dialog');pane.setAttribute('aria-modal','true');pane.setAttribute('aria-label','Anteprima documento di vendita');
   pane.style.cssText='position:fixed;inset:0;z-index:2147483646;overflow-y:auto;background:#f1f5f9;color:#0f172a;font:14px/1.5 Arial,sans-serif;padding:20px;box-sizing:border-box';
   const isForf=(cfg.regime||'').toLowerCase()==='forfettario';
   const total=Number(s.amount)||0;
   const contact=[cfg.piva?'P. IVA '+cfg.piva:'',cfg.email||'',cfg.phone||''].filter(Boolean).join(' · ');
   const date=s.date?new Date(s.date).toLocaleDateString('it-IT'):new Date().toLocaleDateString('it-IT');
   pane.innerHTML='<div class="ingly-v68-print-controls" style="max-width:790px;margin:auto auto 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
     '<strong style="margin-right:auto">Anteprima documento — modalità offline</strong>'+
     '<button id="ingly-v68-print-start" type="button" style="padding:8px 14px;border-radius:7px;border:0;background:#1d4ed8;color:white;cursor:pointer">Stampa / Salva come PDF</button>'+
     '<button id="ingly-v68-print-close" type="button" style="padding:8px 14px;border-radius:7px;border:1px solid #94a3b8;background:white;color:#0f172a;cursor:pointer">Chiudi</button></div>'+
     '<article class="ingly-v68-print-sheet" style="max-width:790px;min-height:900px;background:#fff;margin:auto;padding:52px;box-sizing:border-box;box-shadow:0 5px 24px #0f172a22">'+
     '<h1 style="color:#111827;font-size:27px;margin:0 0 4px">'+clean(cfg.company||'INGLY DESIGN')+'</h1>'+
     '<div style="font-size:12px;color:#64748b">'+clean(contact)+'</div><hr style="margin:25px 0;border:0;border-top:2px solid #e2e8f0">'+
     '<h2 style="font-size:20px;margin:0">Riepilogo vendita — bozza</h2><p style="color:#64748b;margin:5px 0 24px">'+clean(date)+'</p>'+
     '<p><strong>Cliente:</strong> '+clean(s.clientName||'—')+'</p><p><strong>Descrizione:</strong> '+clean(s.desc||s.description||'Prodotto/servizio')+'</p>'+
     '<p><strong>Canale:</strong> '+clean(s.channel||'—')+'</p><p><strong>Stato:</strong> '+clean(s.status||'—')+'</p>'+
     '<hr style="margin:25px 0;border:0;border-top:1px solid #e2e8f0">'+
     '<p style="font-size:18px;display:flex;justify-content:space-between;gap:16px"><strong>Importo registrato</strong><strong>'+clean(amount(total))+'</strong></p>'+
     '<p style="font-size:12px;color:#475569">'+(isForf?'Impostazione profilo: forfettario.':'Il trattamento IVA dipende dalla configurazione e dal documento fiscale effettivo.')+'</p>'+
     '<div style="margin-top:60px;padding:16px;border:1px solid #d97706;background:#fffbeb;color:#78350f;font-size:12px">'+
     '<strong>BOZZA NON FISCALE.</strong> Questa è una stampa di emergenza dei dati di vendita quando la libreria PDF non è disponibile. Non sostituisce fattura elettronica, ricevuta fiscale o verifica di numerazione, imponibile, IVA e bollo.</div></article>';
   let styles=doc.getElementById('ingly-v68-print-css');
   if(!styles){styles=doc.createElement('style');styles.id='ingly-v68-print-css';styles.textContent='@media print{body>*:not(#ingly-v68-print-dialog){display:none!important}#ingly-v68-print-dialog{position:static!important;padding:0!important;background:white!important;overflow:visible!important}#ingly-v68-print-dialog .ingly-v68-print-controls{display:none!important}#ingly-v68-print-dialog .ingly-v68-print-sheet{box-shadow:none!important;margin:0!important;max-width:100%!important;padding:0!important;min-height:auto!important}@page{size:A4;margin:16mm}}';doc.head.appendChild(styles);}
   doc.body.appendChild(pane);
   pane.querySelector('#ingly-v68-print-start').addEventListener('click',()=>root.print());
   pane.querySelector('#ingly-v68-print-close').addEventListener('click',()=>pane.remove());
   pane.addEventListener('keydown',e=>{if(e.key==='Escape')pane.remove();});
   pane.querySelector('#ingly-v68-print-start').focus();
   return true;
 }
 const checks=()=>[
  {name:'ZIP / esportazione portatile',ok:typeof root.JSZip==='function',note:'Libreria incorporata'},
  {name:'Excel XLSX — esportazione',ok:!!root.XLSX?.utils?.book_new,note:root.XLSX?.__inglyFallback?'Fallback XLSX OpenXML offline (non importazione)':'SheetJS originale'},
  {name:'Excel XLSX — importazione',ok:!!root.XLSX?.read&&!root.XLSX?.__inglyFallback,note:'Richiede SheetJS originale'},
  {name:'PDF avanzati (jsPDF)',ok:!!root.jspdf?.jsPDF,note:root.jspdf?.jsPDF?'Disponibile':'Non caricato; per vendite disponibile stampa bozza'},
  {name:'Grafici Chart.js',ok:typeof root.Chart==='function',note:'Canvas/analisi dipendono dalla libreria'},
  {name:'Cattura HTML (html2canvas)',ok:typeof root.html2canvas==='function',note:'Richiesto da alcune stampe'},
  {name:'Database browser',ok:typeof root.indexedDB!=='undefined',note:'Presenza API; non sostituisce test scrittura/rilettura'},
  {name:'Drive / cloud',ok:null,note:'Richiede OAuth e collaudo manuale con account di prova'}
 ];
 function showDiagnostics(){
  doc.getElementById('ingly-v68-qa-dialog')?.remove();
  const wrap=doc.createElement('div');wrap.id='ingly-v68-qa-dialog';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');wrap.setAttribute('aria-label','Stato esportazioni INGLY');
  wrap.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0f172a99;display:grid;place-items:center;padding:12px;box-sizing:border-box';
  const state=checks();
  wrap.innerHTML='<section style="background:var(--bg-card,#fff);color:var(--text,#111827);max-width:680px;width:100%;max-height:90vh;overflow:auto;border-radius:13px;border:1px solid var(--border,#d1d5db);padding:20px;box-shadow:0 20px 70px #0004">'+
   '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h2 style="font-size:18px;margin:0">Verifica esportazioni — v68</h2><button id="ingly-v68-qa-close" type="button" aria-label="Chiudi" style="font-size:20px;min-width:34px;min-height:34px;border:1px solid var(--border,#ccc);border-radius:6px;background:transparent;color:inherit;cursor:pointer">×</button></div>'+
   '<p style="font-size:12px;color:var(--text-muted,#64748b)">Questa diagnostica verifica la disponibilità delle librerie, non certifica fatturazione, OAuth o integrità dei tuoi dati.</p>'+
   '<div style="display:grid;gap:7px">'+state.map(c=>'<div style="border:1px solid var(--border,#ddd);border-radius:9px;padding:9px 11px;display:flex;justify-content:space-between;gap:10px;align-items:start">'+
   '<div><strong style="font-size:13px">'+clean(c.name)+'</strong><div style="font-size:11px;color:var(--text-muted,#64748b)">'+clean(c.note)+'</div></div>'+
   '<strong style="font-size:12px;color:'+(c.ok===true?'#15803d':c.ok===false?'#b45309':'#64748b')+'">'+(c.ok===true?'Disponibile':c.ok===false?'Limitato':'Da testare')+'</strong></div>').join('')+'</div>'+
   '<p style="font-size:12px;margin:16px 0 0"><strong>Prima di mettere in produzione:</strong> backup esterno, import/ripristino su profilo separato, test PDF/XLSX, verifica fatture da commercialista e prova completa dei moduli critici.</p></section>';
  doc.body.appendChild(wrap);
  wrap.querySelector('#ingly-v68-qa-close').addEventListener('click',()=>wrap.remove());
  wrap.addEventListener('click',e=>{if(e.target===wrap)wrap.remove();});
  wrap.addEventListener('keydown',e=>{if(e.key==='Escape')wrap.remove();});
  wrap.querySelector('#ingly-v68-qa-close').focus();
 }
 root.INGLYDocsV68={printSale,checks,showDiagnostics};
 function addButton(){
  const head=doc.querySelector('#view-settings > .page-header');
  if(!head||head.querySelector('#ingly-v68-capabilities'))return;
  const b=doc.createElement('button');b.id='ingly-v68-capabilities';b.type='button';b.className='btn btn-secondary btn-sm';b.textContent='Verifica PDF / Excel / ZIP';
  b.style.cssText='flex:0 0 auto;max-width:100%;white-space:normal;font-size:12px;min-height:32px;padding:6px 10px';
  b.addEventListener('click',showDiagnostics);
  head.appendChild(b);
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',addButton,{once:true});else addButton();
 if(typeof root.MutationObserver==='function'){
   const ob=new root.MutationObserver(()=>{if(!doc.getElementById('ingly-v68-capabilities'))addButton();});
   function listen(){const settings=doc.getElementById('view-settings');if(settings)ob.observe(settings,{childList:true});}
   if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',listen,{once:true});else listen();
 }
})(window,document);
