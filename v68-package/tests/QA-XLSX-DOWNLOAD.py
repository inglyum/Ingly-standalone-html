from pathlib import Path
from playwright.sync_api import sync_playwright
from openpyxl import load_workbook
r=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(accept_downloads=True)
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content('<!doctype html><html><head><meta charset="utf-8"></head><body><button id="down">Export</button></body></html>')
 page.add_script_tag(content=(r/'tests'/'jszip-3.10.1.min.js').read_text())
 page.add_script_tag(content=(r/'INGLY-v68-OFFLINE-XLSX.js').read_text())
 page.evaluate('''() => {document.getElementById('down').onclick = () => {let wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Articolo','Quantità','Costo'],['Acrilico trasparente',0,12.5]]),'Prodotti');XLSX.writeFile(wb,'INGLY-QA-XLSX.xlsx');};}''')
 with page.expect_download(timeout=20000) as info: page.locator('#down').click()
 d=info.value;assert d.suggested_filename=='INGLY-QA-XLSX.xlsx'
 d.save_as(str(r/'tests'/'qa-browser-download.xlsx'))
 assert not errs,errs
 b.close()
w=load_workbook(r/'tests'/'qa-browser-download.xlsx')
assert w.worksheets[0]['A2'].value=='Acrilico trasparente'
assert w.worksheets[0]['B2'].value==0
assert w.worksheets[0]['C2'].value==12.5
print('PASS Chromium real download .xlsx, openpyxl reopened and contents verified, 0 pageerrors')
