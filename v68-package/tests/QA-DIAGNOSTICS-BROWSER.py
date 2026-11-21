from playwright.sync_api import sync_playwright
from pathlib import Path
import json,sys
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':390,'height':844})
  errs=[];page.on('pageerror',lambda e: errs.append(str(e)))
  page.set_content('<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><div id="view-settings"><div class="page-header"><h1>Impostazioni</h1></div></div></body></html>')
  page.add_script_tag(content=(root/'tests'/'jszip-3.10.1.min.js').read_text())
  page.add_script_tag(content=(root/'INGLY-v68-OFFLINE-XLSX.js').read_text())
  page.add_script_tag(content=(root/'INGLY-v68-DOCUMENTS-DIAGNOSTICS.js').read_text())
  page.locator('#ingly-v68-capabilities').click()
  assert page.locator('#ingly-v68-qa-dialog').count()==1
  info=page.evaluate('INGLYDocsV68.checks()')
  assert info[0]['ok']==True and info[1]['ok']==True and info[2]['ok']==False
  page.screenshot(path=str(root/'tests'/'qa-diagnostics-mobile.png'))
  page.locator('#ingly-v68-qa-close').click()
  page.evaluate("INGLYDocsV68.printSale({clientName:'<img src=x onerror=alert(1)>',amount:0,status:'da_pagare'},{company:'INGLY DESIGN',regime:'forfettario'})")
  assert page.locator('#ingly-v68-print-dialog').count()==1
  assert page.locator('#ingly-v68-print-dialog img').count()==0
  assert '<img' in page.locator('#ingly-v68-print-dialog').inner_text()
  assert '0,00' in page.locator('#ingly-v68-print-dialog').inner_text()
  page.screenshot(path=str(root/'tests'/'qa-print-mobile.png'))
  page.locator('#ingly-v68-print-close').click()
  assert page.locator('#ingly-v68-print-dialog').count()==0
  assert not errs,errs
  print('PASS Chromium controlled: diagnostics, XLSX fallback exposed, printable sales draft escaping / zero amounts, close, 0 pageerrors')
  print(json.dumps(info,ensure_ascii=False))
  browser.close()
