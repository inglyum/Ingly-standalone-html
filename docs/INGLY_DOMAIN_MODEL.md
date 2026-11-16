# INGLY OS — Domain Model (Modello Dati Unico)

> Obiettivo: definire le **entità canoniche** e ricondurre i 56 store IndexedDB attuali a un modello **unico e coerente** (benchmark Odoo 20.0), senza duplicare lo stesso cliente/prodotto/ordine tra moduli.
> Principio: **una entità = una fonte di verità**. I moduli leggono/scrivono tramite il Master Data Layer, non direttamente store sovrapposti.

## 1. Store IndexedDB attuali (56) — `InglyMasterDB` v30
clients · sales · quotes · inventory · cashflow · projects · catalog · team · events · innovation · bu · materials · history · backups · settings · equipment · gadgets · fixed_costs · components · social · marketing_campaigns · image_lib · xmlinvoices · orders · bookings · timelogs · timers · social_posts · shipments · suppliers · supplier_orders · ideas · products · **items** · social_accounts · competitors · paints · client_pricelists · notifications · tax_events · goals · cost_entries · supplier_perf · content_analytics · quote_templates · signatures · dash_layout · recurring_invoices · laser_resources · workflow_steps · order_events · **pipeline** · ai_log · kpi_snap · kpi_cache · scanner_history · versions

(+ DB separato `InglyDB` v3 — da ricondurre o documentare.)

## 2. Entità canoniche → store attuale → gap

| Entità canonica (Odoo) | Store attuale | Stato | Note / gap |
|---|---|---|---|
| **Partner/Contact** | `clients`, `suppliers` | 🔁 | Clienti e fornitori separati; Odoo usa un `res.partner` unico con ruoli. Valutare partner unico con flag is_customer/is_supplier. |
| **Lead** | — | ❌ | Assente come entità. Oggi i lead sono clienti “nuovi”. |
| **Opportunity** | `pipeline` (parziale) | 🟡 | La pipeline mescola ordini e opportunità. Separare fase commerciale. |
| **Customer** | `clients` | ✅ | OK, con CLV calcolato. |
| **Supplier** | `suppliers`, `supplier_perf`, `client_pricelists?` | ✅ | Performance in store a parte. |
| **Activity** | `events`, `bookings`, `notifications`, `order_events` | 🔁 | Attività sparse su 4 store. Odoo ha `mail.activity` unico. |
| **Product** | `catalog`, `products` | 🔁 | Due store prodotto. Unificare. |
| **Product Variant** | — | ❌ | Nessun modello varianti esplicito. |
| **Material** | `materials`, `paints`, `laser_resources` | 🔁 | Vedi unificazione `items`. |
| **Component** | `components` | 🔁 | Vedi `items`. |
| **BoM (Distinta base)** | — | ❌ | **Assente** (serve per MRP). |
| **Machine** | `equipment` | 🟡 | Scheda macchina base; mancano profili lavorazione versionati, manutenzione, ammortamento strutturato. |
| **Work Center** | — | ❌ | Assente. |
| **Warehouse / Location** | — (`inventory` monolocazione) | ❌ | Nessun multi-deposito/ubicazione. |
| **Inventory Movement** | `MagazzinoMovimenti` (localStorage?), `items` | 🟡 | Movimenti parzialmente in localStorage; serve store `inventory_moves`. |
| **Unified Item** | `items` | 🟡 | Introdotto (v56) ma non adottato ovunque (inventory/materials/components/gadgets ancora attivi). |
| **Quotation** | `quotes`, `quote_templates` | ✅ | Quoter per-riga OK. |
| **Sales Order** | `orders` / `pipeline` | 🔴 | **Doppia fonte.** Decidere canonico. |
| **Purchase Order** | `supplier_orders` | ✅ | Ciclo riordino→PO→ricezione→carico implementato. |
| **Manufacturing Order** | — (`orders` stato “produzione”) | ❌ | Nessun MO reale con BoM/consumi. |
| **Work Order** | — | ❌ | Assente. |
| **Quality Check** | — | ❌ | Assente. |
| **Shipment** | `shipments` | 🟡 | Presente, da collegare a ordini/magazzino. |
| **Invoice** | `xmlinvoices`, `recurring_invoices`, FatturaDaOrdine | 🟡 | Non a partita doppia. |
| **Payment** | `cashflow`, `PaymentSchedule` | 🟡 | Incassi/pagamenti non pienamente riconciliati. |
| **Expense** | `fixed_costs`, `cost_entries` | 🟡 | Costi fissi + costi reali commessa. |
| **Timesheet** | `timelogs`, `timers` | 🟡 | Due store tempo. |
| **Project** | `projects` | 🟡 | Base; manca redditività per progetto strutturata. |
| **Employee** | `team` | ❌/🟡 | Nessun HR reale. |
| **Document** | `image_lib`, `signatures`, `TemplateDocs` | 🟡 | Sparsi. |
| **Notification** | `notifications` | ✅ | Log notifiche presente. |

## 3. Campi obbligatori per ogni entità (standard INGLY)
Da garantire su ogni record (molti già presenti via `migrateRecord`):
- `id` stabile e univoco (keyPath `id`, autoIncrement) — **conservare gli id esistenti**.
- `createdAt`, `updatedAt` (ISO) — **oggi non uniformi** → aggiungere in migrazione idempotente.
- `status` controllato (enum per entità).
- Relazioni esplicite per **id** (es. `clientId`, `orderId`, `supplierId`) — già usate ma non validate.
- Validazione campi (tipi, obbligatori) — oggi debole.
- Storico modifiche dove serve (`versions`, `history` esistono).
- Regole di cancellazione coerenti (soft-delete vs cascade) — oggi incoerenti.

## 4. Relazioni canoniche (target)
```
Lead ──convert──▶ Opportunity ──win──▶ Customer
Customer ──▶ Quotation ──accept──▶ Sales Order ──▶ Manufacturing Order ──▶ Shipment ──▶ Invoice ──▶ Payment
Sales Order ──needs──▶ BoM ──reserve──▶ Inventory (items) ──shortage──▶ Purchase Order ──receive──▶ Inventory
Manufacturing Order ──▶ Work Orders ──on──▶ Work Centers/Machines ──▶ Quality Check
Project ──▶ Tasks ──▶ Timesheets ──cost──▶ Marginalità commessa
```
Oggi esistono già: Quotation→Order (`PreventivToOrder`), Order→Invoice (`FatturaDaOrdine`), PO→Inventory (riordino). **Mancano** i tratti MRP (BoM, MO, Work Order, Work Center) e la separazione Lead/Opportunity.

## 5. Decisioni aperte (da `INGLY_DATA_MIGRATIONS.md`)
1. Fonte canonica ordini: `orders` **o** `pipeline` (dato l'uso reale 330 vs 102, proposto **`orders`** con `pipeline` come proiezione/adapter).
2. Adozione piena di `items` con adapter che reindirizza `inventory/materials/components/gadgets`.
3. Partner unico vs clienti/fornitori separati.
4. Ricondurre `InglyDB` (v3) e i dati in `localStorage` di dominio dentro `InglyMasterDB`.
