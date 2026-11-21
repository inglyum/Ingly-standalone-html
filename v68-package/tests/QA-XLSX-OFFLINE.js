'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.dirname(__dirname);
const JSZip=require('./jszip-3.10.1.min.js');
const ctx={window:{JSZip,console,document:{body:{appendChild(){}}}},console,URL};
ctx.window.window=ctx.window;
vm.runInNewContext(fs.readFileSync(path.join(root,'INGLY-v68-OFFLINE-XLSX.js'),'utf8'),ctx,{filename:'INGLY-v68-OFFLINE-XLSX.js'});
const XLSX=ctx.window.XLSX;
assert.equal(XLSX.__inglyFallback,true);
const wb=XLSX.utils.book_new();
const sales=XLSX.utils.aoa_to_sheet([
  ['Cliente','Totale','Note','Attivo'],['A&B','0', '"virgolette" <tag> 😀',true],['José à Sicilia',0,'=HYPERLINK("https://evil.test")',false],["D'Oro",12.5,'&< >',true]
]);
sales['!autofilter']={ref:'A1:D1'};
sales['!cols']=[{wch:22},{wch:12},{wch:30},{wch:10}];
XLSX.utils.book_append_sheet(wb,sales,'Vendite?2026');
XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet([{name:'Prodotto',qty:0,cost:1.25},{name:'Plexiglass',qty:20,cost:10}]),'Catalogo');
const returned=XLSX.write(wb,{type:'base64'});
assert.equal(typeof returned.then,'function');
returned.then(async base64=>{
 const buffer=Buffer.from(base64,'base64');
 assert.ok(buffer.length>1000);
 const zip=await JSZip.loadAsync(buffer);
 const contents=Object.keys(zip.files);
 for(const needed of ['[Content_Types].xml','xl/workbook.xml','xl/worksheets/sheet1.xml','xl/worksheets/sheet2.xml','xl/styles.xml'])assert.ok(contents.includes(needed),needed);
 const one=await zip.file('xl/worksheets/sheet1.xml').async('string');
 assert.match(one,/t="inlineStr"/);assert.match(one,/&#39;|D&apos;Oro/);assert.match(one,/<v>0<\/v>/);assert.match(one,/&amp;B/);assert.match(one,/HYPERLINK/);
 const p=path.join(root,'tests','xlsx-offline-sample.xlsx');fs.writeFileSync(p,buffer);
 assert.throws(()=>XLSX.read(new Uint8Array(0)),/Importazione XLSX offline non disponibile/);
 console.log('PASS: JSZip reale: XLSX con 2 fogli, 0 numerico, caratteri speciali, testo-formula, anteprima ZIP, importazione non supportata esplicitamente.');
}).catch(e=>{console.error(e);process.exitCode=1;});
