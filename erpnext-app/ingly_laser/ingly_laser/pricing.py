# INGLY Laser — motore di prezzo per la Quotation ERPNext.
# Riproduce la Knowledge Base INGLY (stessa logica di app-v2/quoter.js) come
# codice di APP Frappe (NON Server Script): nessuna sandbox RestrictedPython,
# gira anche su shared bench di Frappe Cloud.
#
# Costo riga = Materiale(mq×(1+sfrido%)×€/mq) + Laser(min×€/min)
#            + Manodopera(min/60×€/h) + Design + Extra
# Prezzo riga = arrotonda_a_90( costo × (1 + markup_canale/100) ), +25% express.
# Markup canale (KB): B2C 200% · B2B 150% · Etsy 250% · Personalizzato 100%.

import frappe
from frappe.utils import flt

# Preset canale: markup % e margine minimo (coerenti con app-v2 CHANNEL_PRESETS).
CHANNEL_PRESETS = {
    "B2C": {"markup_pct": 200, "min_margin_pct": 65},
    "B2B": {"markup_pct": 150, "min_margin_pct": 55},
    "Etsy": {"markup_pct": 250, "min_margin_pct": 65},
    "Personalizzato": {"markup_pct": 100, "min_margin_pct": 55},
}
EXPRESS_PCT = 25          # urgenza <48h (opt-in)
LABOR_RATE_DEFAULT = 18   # €/h (KB)


def round_to_90(x):
    """Arrotonda per eccesso al più vicino ,90 (mai sotto il valore grezzo)."""
    x = flt(x)
    cand = float(int(x)) + 0.90
    if cand < x - 1e-9:
        cand += 1
    return flt(cand, 2)


def working_cost(item):
    """Costo di produzione unitario della riga dai campi laser INGLY."""
    mq = flt(item.get("ingly_material_mq"))
    sfrido = flt(item.get("ingly_sfrido_pct"))
    cost_mq = flt(item.get("ingly_cost_per_mq"))
    material = mq * (1 + sfrido / 100.0) * cost_mq
    machine = flt(item.get("ingly_laser_min")) * flt(item.get("ingly_cost_per_min"))
    rate_h = flt(item.get("ingly_labor_rate")) or LABOR_RATE_DEFAULT
    labor = flt(item.get("ingly_labor_min")) / 60.0 * rate_h
    design = flt(item.get("ingly_design_cost"))
    extra = flt(item.get("ingly_extra_cost"))
    return flt(material + machine + labor + design + extra, 2)


def compute_quotation(doc, method=None):
    """doc_events Quotation validate: calcola costo e prezzo di ogni riga dai
    campi laser, se presenti. Non tocca le righe senza campi laser (così la
    Quotation standard ERPNext resta invariata)."""
    channel = doc.get("ingly_channel") or "Personalizzato"
    preset = CHANNEL_PRESETS.get(channel, CHANNEL_PRESETS["Personalizzato"])
    express = 1 if doc.get("ingly_express") else 0

    for item in doc.get("items", []):
        # Calcola solo se la riga ha almeno un campo laser valorizzato.
        has_laser = any(flt(item.get(f)) for f in (
            "ingly_material_mq", "ingly_laser_min", "ingly_labor_min",
            "ingly_design_cost", "ingly_extra_cost",
        ))
        if not has_laser:
            continue
        cost = working_cost(item)
        item.ingly_unit_cost = cost
        price = round_to_90(cost * (1 + preset["markup_pct"] / 100.0))
        if express:
            price = round_to_90(price * (1 + EXPRESS_PCT / 100.0))
        # Imposta il prezzo di listino della riga: ERPNext calcola il resto
        # (sconti, imposte, totali) in modo nativo.
        item.price_list_rate = price
        item.rate = price

    # Allerta margine di canale (non blocca: avverte, come in app-v2).
    _warn_low_margin(doc, preset["min_margin_pct"])


def _warn_low_margin(doc, min_margin_pct):
    for item in doc.get("items", []):
        cost = flt(item.get("ingly_unit_cost"))
        rate = flt(item.get("rate"))
        if cost > 0 and rate > 0:
            margin_pct = (rate - cost) / rate * 100.0
            if margin_pct < min_margin_pct:
                frappe.msgprint(
                    frappe._("Riga {0}: margine {1}% sotto il minimo {2}% del canale (KB: mai sotto i minimi).").format(
                        item.get("item_code") or item.idx, round(margin_pct), min_margin_pct
                    ),
                    indicator="orange", alert=True,
                )
