from bs4 import BeautifulSoup
from pathlib import Path
from collections import Counter
import re, subprocess, json, tempfile, hashlib, sys
import tinycss2
root=Path(__file__).resolve().parents[1]
p=root/'INGLY-OS-v68-COMPLETE-QA.html'
s=p.read_text(encoding='utf-8'); html=BeautifulSoup(s,'html.parser')
errors=[]; js=[]
with tempfile.TemporaryDirectory() as tmp:
  for i,t in enumerate(html.find_all('script')):
    txt=t.string or t.get_text()
    if not txt.strip():continue
    fp=Path(tmp)/f'{i:03}.js';fp.write_text(txt)
    r=subprocess.run(['node','--check',str(fp)],capture_output=True,text=True,timeout=15)
    if r.returncode:errors.append(f'SCRIPT {i}: {r.stderr[:300]}')
    else:js.append(i)
css=[];css_errors=[]
for i,t in enumerate(html.find_all('style')):
  stylesheet=t.string or t.get_text();css.append(i)
  for n in tinycss2.parse_stylesheet(stylesheet,skip_comments=True,skip_whitespace=True):
    if n.type=='error':css_errors.append([i,n.message,n.source_line,n.source_column])
ids=[tag['id'] for tag in html.find_all(id=True)]
dups={k:v for k,v in Counter(ids).items() if v>1}
raw=Path('/mnt/data/INGLY-OS-v67-QA-Export-Restore/INGLY-OS-v67-QA-Export-Restore.html').read_text(encoding='utf-8')
checks={
 'db_schema_unchanged':"const DB='InglyMasterDB',VER=31" in s and "const DB='InglyMasterDB',VER=31" in raw,
 'source_v67_scripts_preserved': len(html.find_all('script'))>=len(BeautifulSoup(raw,'html.parser').find_all('script')),
 'offline_excel_present':s.count('data-ingly-v68="offline-xlsx"')==1,
 'diagnostics_present':s.count('data-ingly-v68="documents-and-qa"')==1,
 'sales_pdf_fallback_guard':"return window.INGLYDocsV68.printSale(s,cfg)" in s,
 'monthly_pdf_guard':"PDF mensile non disponibile offline" in s,
 'export_catalog_zip_await_write': "const xlsxBuf = await XLSX.write(wb, {type:'base64', bookType:'xlsx'});" in s,
 'metadata_v68': bool(re.search(r'<title>INGLY OS v68',s)),
 'zip_embedded':'JSZip v3.10.1' in s,
}
report={'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(), 'scripts_checked':len(js),'scripts_with_errors':len(errors), 'js_errors':errors,'style_blocks':len(css),'css_parse_errors':css_errors,'id_count':len(ids),'id_duplicates':dups,'checks':checks, 'external_dependencies':[t.get('src') for t in html.find_all('script',src=True)]}
(root/'QA-STATIC.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in report.items() if k not in ('external_dependencies','js_errors')},ensure_ascii=False,indent=2))
if errors or css_errors or dups or not all(checks.values()):sys.exit(1)
