app_name = "ingly_laser"
app_title = "INGLY Laser"
app_publisher = "Ingly Design"
app_description = "Costeggio per lavorazione (laser/UV/3D) e pricing KB INGLY sulla Quotation ERPNext"
app_email = "inglydesign@gmail.com"
app_license = "MIT"
required_apps = ["frappe", "erpnext"]

# Campi personalizzati (header Quotation + righe Quotation Item) via fixtures.
fixtures = [
    {"dt": "Custom Field", "filters": [["name", "like", "%-ingly_%"]]},
]

# Calcolo prezzi KB INGLY su validate della Quotation (app code, no Server Script).
doc_events = {
    "Quotation": {
        "validate": "ingly_laser.pricing.compute_quotation",
    },
}
