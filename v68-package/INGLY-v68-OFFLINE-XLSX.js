/* INGLY OS v68 — Export XLSX offline (fallback, non modifica SheetJS se disponibile).
 * Usa JSZip 3.10.1 incluso nel file originale. Genera XLSX OpenXML validi.
 * Copre: aoa_to_sheet, json_to_sheet, table_to_sheet, book_new,
 * book_append_sheet, write, writeFile. Import .read richiede SheetJS.
 * Tutte le stringhe sono serializzate come inlineStr, non formule. */
(function (root) {
  'use strict';
  if (root.XLSX || root.__INGLY_XLSX_OFFLINE__) return;
  const SHEET_LIMIT = 1048576, COL_LIMIT = 16384;
  function xml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,''); }
  function col(n) { let v=''; for(++n;n>0;n=Math.floor((n-1)/26))v=String.fromCharCode(65+(n-1)%26)+v;return v; }
  function safeName(raw,existing) {
    let name=String(raw || 'Foglio').replace(/[\\/*?:\[\]]/g,' ').trim().slice(0,31)||'Foglio';
    const original=name;let i=2;
    while(existing.some(k=>k.toLocaleLowerCase()===name.toLocaleLowerCase())) {
      const s=' ('+(i++)+')';name=original.slice(0,31-s.length)+s;
    }return name;
  }
  function toRows(sheet) {
    if (sheet && Array.isArray(sheet.__inglyRows)) return sheet.__inglyRows;
    // Supporta anche sheet SheetJS già trasformati in A1/B2; prova generica.
    const out=[];
    if(sheet && typeof sheet==='object') Object.keys(sheet).forEach(key=>{
      const m=/^([A-Z]+)([1-9]\d*)$/.exec(key);if(!m)return;
      const r=+m[2]-1;let c=0;for(let j=0;j<m[1].length;j++)c=c*26+(m[1].charCodeAt(j)-64);c--;
      if(r>=SHEET_LIMIT||c>=COL_LIMIT)throw Error('Limite XLSX superato');
      (out[r]||(out[r]=[]))[c]=sheet[key]?.v;
    });return out;
  }
  function sheetXml(sheet){
    const rows=toRows(sheet);if(rows.length>SHEET_LIMIT)throw Error('Troppe righe per Excel');
    const cols=sheet?.['!cols'];let maxCol=0;
    const body=rows.map((row,ri)=>{
      if(!Array.isArray(row))return '';
      if(row.length>COL_LIMIT)throw Error('Troppe colonne per Excel');
      const cells=[];
      row.forEach((v,ci)=>{
        if(v===undefined||v===null||v==='')return;
        maxCol=Math.max(maxCol,ci+1);
        const ref=col(ci)+(ri+1);
        if(v instanceof Date && !isNaN(v))v=v.toISOString().replace('T',' ').slice(0,19);
        if(typeof v==='number'&&Number.isFinite(v))cells.push('<c r="'+ref+'"><v>'+v+'</v></c>');
        else if(typeof v==='boolean')cells.push('<c r="'+ref+'" t="b"><v>'+(v?1:0)+'</v></c>');
        else cells.push('<c r="'+ref+'" t="inlineStr"><is><t xml:space="preserve">'+xml(v)+'</t></is></c>');
      });
      return cells.length?'<row r="'+(ri+1)+'">'+cells.join('')+'</row>':'';
    }).join('');
    let customCols='';
    if(Array.isArray(cols))customCols='<cols>'+cols.map((c,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+(Number(c?.wch||13)+1)+'" customWidth="1"/>').join('')+'</cols>';
    const validRange = sheet?.['!autofilter']?.ref;
    const filter=validRange&&/^[A-Z]+\d+:[A-Z]+\d+$/.test(validRange)?'<autoFilter ref="'+validRange+'"/>':'';
    const dimension='A1:'+(maxCol?col(maxCol-1):'A')+Math.max(1,rows.length);
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
      '<dimension ref="'+dimension+'"/><sheetViews><sheetView workbookViewId="0"/></sheetViews>'+
      '<sheetFormatPr defaultRowHeight="15"/>'+customCols+'<sheetData>'+body+'</sheetData>'+filter+'</worksheet>';
  }
  async function write(wb, opts={}){
    if(typeof root.JSZip!=='function') throw Error('JSZip non disponibile: esportazione XLSX offline non possibile');
    const zs=new root.JSZip();
    const names=wb.SheetNames||[];
    if(!names.length)throw Error('Cartella Excel senza fogli');
    const paths=names.map((_,i)=>'worksheets/sheet'+(i+1)+'.xml');
    zs.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?>'+
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
      '<Default Extension="xml" ContentType="application/xml"/>'+
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
      paths.map(x=>'<Override PartName="/xl/'+x+'" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>');
    zs.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?>'+
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    zs.file('xl/workbook.xml','<?xml version="1.0" encoding="UTF-8"?>'+
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+
      names.map((name,i)=>'<sheet name="'+xml(name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>');
    zs.file('xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?>'+
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
      names.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="'+paths[i]+'"/>').join('')+
      '<Relationship Id="rId'+(names.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
    zs.file('xl/styles.xml','<?xml version="1.0" encoding="UTF-8"?>'+
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
      '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>'+ 
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'+ 
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'+ 
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+ 
      '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>'+
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'+
      '</styleSheet>');
    names.forEach((name,i)=>zs.file('xl/'+paths[i],sheetXml(wb.Sheets[name])));
    const t=opts.type==='base64'?'base64':opts.type==='uint8array'?'uint8array':'blob';
    return zs.generateAsync({type:t,compression:'DEFLATE',compressionOptions:{level:6}});
  }
  const utils={
    book_new:()=>({SheetNames:[],Sheets:{}}),
    book_append_sheet(wb,sheet,name){ const n=safeName(name,wb.SheetNames);wb.SheetNames.push(n);wb.Sheets[n]=sheet;return n;},
    aoa_to_sheet(rows){return {__inglyRows:Array.isArray(rows)?rows:[]};},
    json_to_sheet(records,options={}){
      const rs=Array.isArray(records)?records:[];
      const headers=Array.isArray(options.header)?options.header.slice():[];
      rs.forEach(r=>Object.keys(r||{}).forEach(k=>{if(!headers.includes(k))headers.push(k);}));
      return {__inglyRows:[...(options.skipHeader?[]:[headers]),...rs.map(r=>headers.map(h=>r?.[h]??''))]};
    },
    table_to_sheet(table){const rows=[];if(!table?.querySelectorAll)return {__inglyRows:rows};table.querySelectorAll('tr').forEach(tr=>{rows.push([...tr.querySelectorAll('td,th')].map(td=>td.textContent.trim()));});return {__inglyRows:rows};}
  };
  const fallback={__inglyFallback:true,utils,write,
    async writeFile(wb,filename,opts={}){
      try{
        const blob=await write(wb,{...opts,type:'blob'});
        if(!root.document?.createElement||!root.URL?.createObjectURL)throw Error('Download browser non disponibile');
        const href=root.URL.createObjectURL(blob),a=root.document.createElement('a');
        a.href=href;a.download=filename||'export.xlsx';a.style.display='none';
        root.document.body.appendChild(a);a.click();a.remove();
        root.setTimeout(()=>root.URL.revokeObjectURL(href),30000);
        return blob;
      }catch(e){
        if(typeof root.toast==='function')root.toast('Export XLSX non riuscito: '+e.message,'error');
        else if(root.console)root.console.error('[INGLY XLSX]',e);
        throw e;
      }
    },
    read(){throw Error('Importazione XLSX offline non disponibile: usa CSV o connettiti per caricare SheetJS.');}
  };
  root.XLSX=fallback;
  root.__INGLY_XLSX_OFFLINE__=fallback;
})(window);
