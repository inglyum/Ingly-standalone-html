# INGLY OS — Module Matrix

> Inventario dei **313 moduli JS** (`window.X`) raggruppati nelle 10 macroaree ERP (benchmark Odoo 20.0).
> Legenda stato: ✅ funzionante · 🟡 parziale/da rifinire · 🔁 **duplicato/sovrapposto** (consolidare) · 🧪 utility/infra.
> Obiettivo della matrice: evidenziare **dove più moduli fanno la stessa cosa** (da unificare, non da cancellare).

## Come leggere questa matrice
Molti “moduli” sono in realtà **layer/patch successivi** sullo stesso dominio (es. `Pipeline`, `PipelineOS`, `PipelineArchive`, `PipelineArchivePatch`, `PatchKanban`, `GestioneOrdini`). Non vanno eliminati alla cieca: vanno ricondotti a **un modulo canonico per dominio** con adapter di compatibilità.

---

## 0 · Infrastruttura / Core (🧪)
`App` · `AppStore` · `IDB` · `Bus` · `NavBus` · `DataLayer` · `StoreUnification` · `Store` · `SectionCache` · `RenderQueue` · `ModalManager`/`Dialog`/`ModMgr` · `NavigationGuard`/`UIGuard` · `KeyboardShortcuts`/`CmdK`/`CmdPalette` · `GlobalSearch`/`SmartSearch` · `UndoStack`/`UndoHistory` · `AbortableTimer` · `CurrencyEngine`
→ **Base solida.** `DataLayer`/`StoreUnification` sottoutilizzati: candidati a diventare il vero “Master Data Layer”.

## 1 · Dashboard (✅/🔁)
`Dashboard` · `DashboardPro` · `DashboardToday`/`TodayWidget`/`OggiWidget`/`DashboardWidgets` · `DashLayout`/`DashboardPDFExport` · `QuickStats` · `HealthScore` · `BriefingActions`
🔁 Sovrapposizione “oggi/widget” (4 moduli). Consolidare in 1 dashboard configurabile.

## 2 · CRM & Vendite (🔁 forte)
**Clienti:** `Clients` · `ClientProfile` · `ClientTimeline` · `ClientLifecycle` · `ClientEnhancements` · `ClienteNoteInterne` · `ClientIntelligence` · `ClientIntelligenceEngine` · `ClientListino`/`ClientPricing`/`ClientListino`
**CRM analytics/pipeline:** `CRMDash` · `CRMStats` · `CRMSegmentation` · `CRMSmart` · `CRMMerge` · `CLVDash` · `AICLV` · `LeadScorer` · `OpportunityScanner` · `InglyCRMBridge`
**Comunicazione:** `CommHistory` · `EmailTemplates` · `InglyEmail` · `WABusiness`/`WAQuick`/`WAScheduler`/`WATemplates`/`WAAutoNotify`/`WAQuoteTemplate` · `ReplyAI`/`AIReplyAssistant` · `GoogleContacts`
**Vendite:** `Sales` · `SalesArchive` · `SalesStats` · `SalesSparkline` · `SalesLineItems`
🔁 **~15 moduli cliente/CRM** parzialmente ridondanti. Manca il modello esplicito **Lead → Opportunity → Customer** (Odoo `crm`). La scheda cliente 360° esiste (`CRMDash`) ed è già collegata ai preventivi.

## 3 · Preventivi / Smart Quoter (🔁)
`Quoter` (principale, per-riga) · `QuoteGenerator` · `QuoteIntelligence`/`QuoteLineEditor` · `QuoterTemplates`/`QuoteTemplatePicker`/`QuoteTemplatesModule` · `QuoterBridge`/`QuoterImagePanel` · `QuoteShare`/`ShareableQuoteLink` · `QuoteLanguage`/`MultiLangPDF` · `PreventivToOrder`/`PreventivoArchivio` · `LaserCalcPage`/`LaserCalcV2`/`LaserCalcHistory`/`CalcMacchine`/`PaintCalc` · `DigitalSignature`/`SignaturePad`
🔁 Più “calcolatori” preventivo. Il principale è già per-riga. Da unificare il **motore prezzi** (vedi area Pricing) e la conversione preventivo→ordine (`PreventivToOrder`).

## 4 · Produzione / Workflow (🔁 forte)
`GestioneOrdini` (Kanban unificato attivo) · `Orders`/`OrdersDB`/`OrdersListView` · `Pipeline`/`PipelineOS`/`PipelineArchive`/`PipelineArchivePatch`/`PipelineCalendarPro` · `Workflow`/`WorkflowBridge`/`WorkflowDashboard`/`WorkflowSync`/`OrderFlow` · `PatchKanban`/`KanbanOS` · `ProductionTimer`/`Produzione` · `OrderMaterials`/`OrderSpecs`/`OrderChecklist`/`OrderTracker`/`OrderQuickNote`/`OrderAutoComplete`/`OrderImporter` · `GanttOrdini`/`GanttOrdini`
🔁 **~20 moduli** su ordini/workflow con **doppia fonte `orders`/`pipeline`** (vedi audit §4). **MRP assente** (no BoM multilivello, no Work Orders/Work Centers, no capacità) → gap Odoo `mrp` più grande.

## 5 · Magazzino & Acquisti (🔁)
**Magazzino:** `Inventory` · `InventoryReorder` · `ItemsModule`/`ItemsPicker` · `Materials` · `Components` · `Gadgets` · `Warehouse` · `MagazzinoFabbisogno`/`MagazzinoImporter`/`MagazzinoMovimenti`/`MagazzinoSync` · `LaserB2B` StockManager · `ResourcePicker`/`LaserResources`
**Acquisti/Fornitori:** `SupplierIntel`/`SupplierIntelligence` · `FORNITORI_DB` · `SuppliersManager` (ordini acquisto reali) · riordino→PO→ricezione→carico già implementato
🔁 `items` vs `inventory/materials/components/gadgets` **non unificati**. Manca multi-deposito/ubicazioni, riservato/in-arrivo, lotti (gap Odoo `stock`).

## 6 · Finance & Accounting (🟡)
`Finance` · `Cashflow` · `PrimaNota` · `BankFunds`/`BankFundsV2` · `FatturaDaOrdine`/`FatturaRapida`/`AutoInvoicePDF` · `RecurringInvoices` · `IVAConfig` · `XMLSDIModule` (fattura elettronica) · `TaxCalendar`/`FiscalRadar` · `ExportCommercialista` · `PaymentSchedule`/`PaymentWizard`/`StripeLink` · `Solleciti` · `InvestPlanner`/`RevSim`/`RevenueForecast`/`FinancialForecaster`
🟡 Copertura ampia ma **non a partita doppia** né riconciliazione reale. `BankFunds`/`BankFundsV2` duplicati. SDI/fattura elettronica presente ma **non dichiarare conformità senza verifica**.

## 7 · Marketing (🟡)
`MarketIntel`/`MarketAgent`/`LiveIntel`/`IntelHub` · `CompetitorAI`/`CompetitorMon`/`CompTrack` · `ContentPerf`/`ProductHunter`/`TrendScanner` · `EtsyAI`/`EtsyAnalytics`/`EtsyPulse`/`EtsySEOWizard`/`EtsyCSVImporter` · `SocialProofAI` · `CatalogPublish`/`CatalogQR`/`CatalogPDF` · `CampaignManager`(skill)
🟡 Molti strumenti, poca integrazione col CRM/vendite.

## 8 · Progetti & Team / HR (🟡)
`Projects`(store) · `GanttOrdini` · `TimeTracker`/`ProductionTimer`/`timelogs` · `team`(store)/`EventCoordinator` · `AutoHourlyRate`
🟡 Niente HR reale (presenze/turni/assenze/costo orario strutturato) → gap Odoo `hr`.

## 9 · Business Intelligence & AI (🔁)
**Hub/infra:** `AIHub` · `AILayer` · `AIProvider`/`AIProviderPanel` · `ApiKeyManager` · `AIMemory` · `AISetupGuide`/`AIDemoMode`
**Agenti/analisi:** `AIPredictor` · `AIAnomaly` · `AICoach` · `AIReorder` · `AICLV` · `AIVision` · `AnchorAI`/`Anchoring` · `DecisionEngine` · `ClientIntelligenceEngine` · `DemandPredictor`/`DemandMap` · `PriceAdvisor`/`DynamicPriceSuggester` · `ProfitLeakDetector`/`ProfitScope` · `BizAI`/`QuoteIntelligence`/`ProductIntelligence`
🔁 ~25 moduli AI. Serve **architettura ad agenti centrale** con dati minimi necessari, permessi e log (Sprint 9).

## 10 · Sistema / Sicurezza / Sync (🔁)
`Admin` · `SaaSGate` · `LicenseManager` · `WhiteLabel`/`InglyWhiteLabel` · `ProfileManager`/`CompanyProfile`/`BrandConfig`/`BrandIdentity`/`InglyLabProfile` · `AutoBackup`/`BackupAuto`/`AutoCloudSync`/`CloudUpdater` · `InglyCloud`/`InglyCloudSync`/`InglyCloudAdmin`/`InglySync`/`SyncEngine`/`GoogleDriveSync`/`MagazzinoSync` · `PushNotifications`/`SmartNotif`/`SmartNotifV2`/`SmartReminder` · `ModMgr`
🔁 **Sync/backup molto frammentato** (≥8 moduli). `SaaSGate`/`LicenseManager` = **solo client-side** (vedi Security).

---

## Sintesi duplicazioni da consolidare (priorità)
| Dominio | Moduli coinvolti (circa) | Canonico proposto |
|--------|--------------------------|-------------------|
| Ordini/Workflow | ~20 | `GestioneOrdini` + fonte unica `orders` |
| CRM/Clienti | ~15 | `Clients` + `CRMDash` + modello Lead/Opportunity |
| Quoter | ~10 | `Quoter` + motore prezzi unico |
| Magazzino/Items | ~10 | store `items` unico + adapter legacy |
| Pricing/Cost | ~8 | `PricingEngine` + `RealCostEngine` |
| Sync/Backup | ~8 | 1 `SyncEngine` + 1 `BackupEngine` |
| AI | ~25 | `AIHub` + agenti registrati |

> Nessun modulo va cancellato in questo sprint. La matrice guida i **merge incrementali** degli Sprint 2–9, sempre con adapter di compatibilità.
