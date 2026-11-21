from pathlib import Path
import re
root=Path('/mnt/data/INGLY-OS-v68-Roadmap-Release')
source=Path('/mnt/data/INGLY-OS-v67-QA-Export-Restore/INGLY-OS-v67-QA-Export-Restore.html').read_text(encoding='utf-8')
s=source
s=s.replace('<title>INGLY OS v67 — Export &amp; Restore (QA Candidate)</title>', '<title>INGLY OS v68 — Documenti &amp; Roadmap (QA Candidate)</title>')
s=s.replace('content="v67-QA-Export-Restore"', 'content="v68-QA-Documents-Roadmap"')
# ISO Export: in fallback write is asynchronous; native SheetJS remains synchronous.
old="const xlsxBuf = XLSX.write(wb, {type:'base64', bookType:'xlsx'});"
new="const xlsxBuf = await XLSX.write(wb, {type:'base64', bookType:'xlsx'});"
assert s.count(old)==1
s=s.replace(old,new,1)
# Sales invoice: no uncaught TypeError without jsPDF, native print draft instead.
old="const cfg=await IDB.get('settings','main')||{};\n    const{jsPDF}=window.jspdf;"
new="const cfg=await IDB.get('settings','main')||{};\n    if(!window.jspdf?.jsPDF){ return window.INGLYDocsV68.printSale(s,cfg); }\n    const{jsPDF}=window.jspdf;"
assert s.count(old)==1;s=s.replace(old,new,1)
# monthly reports PDF guard
old="const { jsPDF } = window.jspdf;\n    const doc = new jsPDF();"
new="if(!window.jspdf?.jsPDF){toast('PDF mensile non disponibile offline: serve jsPDF. Verifica da Impostazioni.','warning');return;}\n    const { jsPDF } = window.jspdf;\n    const doc = new jsPDF();"
assert s.count(old)==1;s=s.replace(old,new,1)
# Append scripts to document without rewriting all other source or source code strings.
end=s.rfind('</html>')
assert end>0
injected='\n<!-- INGLY v68: offline OpenXML + document print + capability diagnostics -->\n'+''.join(
 '\n<script data-ingly-v68="'+name+'">\n'+(root/path).read_text(encoding='utf-8')+'\n</script>\n' for name,path in [('offline-xlsx','INGLY-v68-OFFLINE-XLSX.js'),('documents-and-qa','INGLY-v68-DOCUMENTS-DIAGNOSTICS.js')]
)
s=s[:end]+injected+s[end:]
assert s.count('data-ingly-v68=')==2
(root/'INGLY-OS-v68-COMPLETE-QA.html').write_text(s,encoding='utf-8')
print('wrote v68',len(s),'characters',len(s.encode('utf-8')),'bytes')
