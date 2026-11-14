# INGLY Laser — app custom per ERPNext

Estende la **Quotation** di ERPNext con il costeggio **per lavorazione**
(materiale mq+sfrido, laser min×€/min, manodopera €/h, design, extra) e il
**pricing della Knowledge Base INGLY** (markup per canale, express +25%,
arrotondamento ,90, allerta margine minimo). Nessuna Server Script sandboxata:
è **codice di app**, quindi funziona anche su shared bench di Frappe Cloud.

## Cosa aggiunge
- Campi su **Quotation** (header): Canale (B2C/B2B/Etsy/Personalizzato), Express.
- Campi su **Quotation Item** (riga): mq, sfrido %, €/mq, laser min, €/min,
  manodopera min, €/h, design, extra, e **Costo produzione** (calcolato).
- Su *validate* della Quotation: per ogni riga con campi laser valorizzati,
  calcola il costo e imposta il **prezzo di listino** della riga
  (`price_list_rate`/`rate`); ERPNext fa il resto (sconti, imposte, totali,
  PDF, email, conversione in Sales Order).
- **Allerta** (non bloccante) se una riga va sotto il margine minimo del canale.

## Markup canale (KB INGLY)
B2C 200% · B2B 150% · Etsy 250% · Personalizzato 100% · Express +25% · ,90.
(Allineati a `app-v2/src/quoter.js` — stessa logica, stessa KB.)

## Installazione

### Frappe Cloud (consigliato, zero server)
1. Dashboard → **Apps** → **Add App** → **Install from GitHub** → URL del repo
   che contiene `erpnext-app/ingly_laser` (o carica l'app come repo a sé).
2. Associa l'app al tuo **Bench**, poi **Install** sul tuo **Site**.
3. Il deploy esegue `bench migrate`: i Custom Field vengono creati dai fixtures.

### Self-host (bench)
```bash
bench get-app ingly_laser /percorso/a/erpnext-app/ingly_laser   # o da Git
bench --site ilmiosito install-app ingly_laser
bench --site ilmiosito migrate
bench build && bench restart
```

## Uso
1. Crea una **Quotation**, scegli il **Cliente** e il **Canale** (sez. "INGLY · Opzioni prezzo").
2. Aggiungi una riga prodotto, espandi **"INGLY · Configura Lavorazione"**,
   inserisci mq/sfrido/€mq, laser min/€min, manodopera, design, extra.
3. **Salva**: il prezzo della riga si calcola da solo (costo × markup canale, ,90).
4. Prosegui col flusso ERPNext: PDF, email, approvazione, → Sales Order.

## Note tecniche
- Le righe **senza** campi laser restano quotazioni ERPNext standard (invariate).
- Il calcolo è nel `doc_events` (`ingly_laser/pricing.py`), non in Server Script.
- Sconti quantità/cliente: usa le **Pricing Rules** native di ERPNext.
- Da installare e testare sulla **tua** istanza ERPNext (qui non è eseguibile).
