from datetime import datetime
from html import escape
import io

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

NAVY = colors.HexColor("#1A3E6F")
GOLD = colors.HexColor("#C8972B")
TEAL = colors.HexColor("#0F6E56")
OFF_WHITE = colors.HexColor("#F7F7F7")
LIGHT_GRAY = colors.HexColor("#E5E7EB")


def _text(value) -> str:
    if value is None:
        return ""
    return str(value)


def _xml_text(value) -> str:
    return escape(_text(value), quote=True)


def _number(value, default: float = 0) -> float:
    if value in (None, ""):
        return default
    try:
        if isinstance(value, str):
            value = value.replace(",", "").strip()
        return float(value)
    except (TypeError, ValueError):
        return default


def _money(value) -> str:
    return f"{_number(value):,.2f}"


def generate_order_sheet_pdf(campaign: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )
    elements = []

    header_data = [[
        Paragraph(
            '<font color="#1A3E6F"><b>KBC</b></font> <font color="#C8972B">Digital Division</font>',
            ParagraphStyle("h", fontSize=20, fontName="Helvetica-Bold"),
        ),
        Paragraph(
            '<font color="#1A3E6F"><b>DIGITAL ADBOARD ORDER SHEET</b></font>'
            f'<br/><font color="#C8972B" size="10">{_xml_text(campaign.get("dabRef", ""))}</font>',
            ParagraphStyle("ref", fontSize=8, alignment=TA_RIGHT),
        ),
    ]]
    header_table = Table(header_data, colWidths=[100 * mm, 70 * mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
    ]))
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", thickness=2, color=NAVY))
    elements.append(Spacer(1, 5 * mm))

    client = campaign.get("client", {})
    campaign_info = campaign.get("campaign", {})
    client_data = [
        ["CLIENT DETAILS", "CAMPAIGN DETAILS"],
        [
            f"Name: {_text(client.get('name'))}\n"
            f"Company: {_text(client.get('company'))}\n"
            f"Contact: {_text(client.get('contact'))}\n"
            f"Email: {_text(client.get('email'))}\n"
            f"Phone: {_text(client.get('phone'))}",
            f"Campaign: {_text(campaign_info.get('name'))}\n"
            f"Start: {_text(campaign_info.get('startDate'))}\n"
            f"End: {_text(campaign_info.get('endDate'))}\n"
            f"Flight Days: {_text(campaign_info.get('flightDays'))} days",
        ],
    ]
    client_table = Table(client_data, colWidths=[85 * mm, 85 * mm])
    client_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("PADDING", (0, 0), (-1, -1), 3 * mm),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ("BACKGROUND", (0, 1), (-1, -1), OFF_WHITE),
    ]))
    elements.append(client_table)
    elements.append(Spacer(1, 5 * mm))

    elements.append(Paragraph(
        "CAMPAIGN LINE ITEMS",
        ParagraphStyle("s", fontSize=9, fontName="Helvetica-Bold", textColor=NAVY, spaceAfter=2 * mm),
    ))
    line_items = campaign.get("lineItems", [])
    item_data = [["Product", "Platform", "Qty", "Posts/Day", "Unit Price (KSh)", "Total (KSh)"]]
    for item in line_items:
        item_data.append([
            _text(item.get("productName")),
            _text(item.get("platform")),
            _text(item.get("quantity", 0)),
            _text(item.get("postsPerDay", 0)),
            _money(item.get("unitPrice")),
            _money(item.get("totalPrice")),
        ])
    item_table = Table(item_data, colWidths=[40 * mm, 30 * mm, 15 * mm, 20 * mm, 30 * mm, 30 * mm])
    item_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 2.5 * mm),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, OFF_WHITE]),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
    ]))
    elements.append(item_table)
    elements.append(Spacer(1, 4 * mm))

    boosting = campaign.get("boosting", {})
    if boosting.get("required"):
        platforms = ", ".join(_text(platform) for platform in (boosting.get("platforms") or []))
        on_top = "ON TOP OF ORDER VALUE" if boosting.get("isOnTopOfOrder") else "INCLUDED IN ORDER VALUE"
        boosting_label = f"{platforms} | KSh {_money(boosting.get('budget'))} | {on_top}"
    else:
        boosting_label = "NIL"
    boost_table = Table([["BOOSTING", boosting_label]], colWidths=[40 * mm, 130 * mm])
    boost_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), TEAL),
        ("TEXTCOLOR", (0, 0), (0, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("PADDING", (0, 0), (-1, -1), 2.5 * mm),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
    ]))
    elements.append(boost_table)
    elements.append(Spacer(1, 4 * mm))

    totals = campaign.get("totals", {})
    discount = campaign.get("discount", {})
    totals_data = [["Subtotal", f"KSh {_money(totals.get('subtotal'))}"]]
    if discount.get("status") == "approved":
        totals_data.append([
            f"Discount ({_number(discount.get('percentage')):g}%) - Approved by {_text(discount.get('approvedBy'))}",
            f"- KSh {_money(totals.get('discountValue'))}",
        ])
    totals_data.append(["VAT (16%)", f"KSh {_money(totals.get('vatAmount'))}"])
    totals_data.append(["GRAND TOTAL", f"KSh {_money(totals.get('grandTotal'))}"])
    totals_table = Table(totals_data, colWidths=[130 * mm, 40 * mm])
    totals_table.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, -1), (-1, -1), NAVY),
        ("BACKGROUND", (0, -1), (-1, -1), OFF_WHITE),
        ("PADDING", (0, 0), (-1, -1), 2.5 * mm),
        ("LINEABOVE", (0, -1), (-1, -1), 1, GOLD),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 8 * mm))

    sig_data = [[
        Paragraph(
            "Client Signature & Stamp<br/><br/><br/><br/>____________________________"
            f"<br/>Name: {_xml_text(client.get('contact'))}<br/>Date: ___________________",
            ParagraphStyle("sig", fontSize=8),
        ),
        Paragraph(
            "Advertising Manager<br/><br/><br/><br/>____________________________"
            "<br/>Name: ___________________<br/>Date: ___________________",
            ParagraphStyle("sig", fontSize=8),
        ),
    ]]
    sig_table = Table(sig_data, colWidths=[85 * mm, 85 * mm])
    sig_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ("PADDING", (0, 0), (-1, -1), 4 * mm),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(sig_table)
    elements.append(Spacer(1, 5 * mm))

    elements.append(HRFlowable(width="100%", thickness=1, color=LIGHT_GRAY))
    elements.append(Paragraph(
        '<font color="#1A3E6F" size="7">'
        f'KBC Digital Division - Internal Document - {_xml_text(campaign.get("dabRef", ""))} - '
        f'Generated {datetime.now().strftime("%d %B %Y %H:%M")} - '
        'This document is locked and non-editable</font>',
        ParagraphStyle("footer", fontSize=7, alignment=TA_CENTER, spaceBefore=2 * mm),
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()

<<<<<<< HEAD
# ============================================================
# 🆕 NEW: Generate Report PDF (Add this at the BOTTOM of the file)
# ============================================================
def generate_report_pdf(campaign: dict, report: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=20*mm, leftMargin=20*mm,
        topMargin=15*mm, bottomMargin=15*mm
    )
    elements = []

    # Header
    header_data = [[
        Paragraph(
            '<font color="#1A3E6F"><b>KBC</b></font> <font color="#C8972B">Digital Division</font>',
            ParagraphStyle("h", fontSize=20, fontName="Helvetica-Bold"),
        ),
        Paragraph(
            '<font color="#1A3E6F"><b>CAMPAIGN PERFORMANCE REPORT</b></font>'
            f'<br/><font color="#C8972B" size="10">{_xml_text(campaign.get("dabRef", ""))}</font>',
            ParagraphStyle("ref", fontSize=8, alignment=TA_RIGHT),
        ),
    ]]
    header_table = Table(header_data, colWidths=[100 * mm, 70 * mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
    ]))
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", thickness=2, color=NAVY))
    elements.append(Spacer(1, 5 * mm))

    # Campaign & Report Info
    client = campaign.get("client", {})
    campaign_info = campaign.get("campaign", {})
    report_info_data = [
        ["CAMPAIGN DETAILS", "REPORT DETAILS"],
        [
            f"DAB Ref: {_text(campaign.get('dabRef',''))}\n"
            f"Campaign: {_text(campaign_info.get('name',''))}\n"
            f"Client: {_text(client.get('company',''))}",
            f"Generated By: {_text(report.get('generatedBy',''))}\n"
            f"Generated At: {_text(report.get('generatedAt',''))}"
        ]
    ]
    report_info_table = Table(report_info_data, colWidths=[85 * mm, 85 * mm])
    report_info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("PADDING", (0, 0), (-1, -1), 3 * mm),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ("BACKGROUND", (0, 1), (-1, -1), OFF_WHITE),
    ]))
    elements.append(report_info_table)
    elements.append(Spacer(1, 5 * mm))

    # Delivered Items
    elements.append(Paragraph("DELIVERED ITEMS", ParagraphStyle("s", fontSize=9, fontName="Helvetica-Bold", textColor=NAVY, spaceAfter=2 * mm)))
    delivered_items = report.get("deliveredItems", [])
    deliverable_data = [["Deliverable", "Quantity", "Notes"]]
    for item in delivered_items:
        deliverable_data.append([
            _text(item.get("name")),
            _text(item.get("quantity")),
            Paragraph(_text(item.get("notes")), ParagraphStyle("notes", fontSize=8))
        ])
    deliverable_table = Table(deliverable_data, colWidths=[60 * mm, 20 * mm, 90 * mm])
    deliverable_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 2.5 * mm),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, OFF_WHITE]),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(deliverable_table)
    elements.append(Spacer(1, 5 * mm))

    # Notes Section
    if report.get("notes"):
        elements.append(Paragraph("EXECUTION NOTES", ParagraphStyle("s", fontSize=9, fontName="Helvetica-Bold", textColor=NAVY, spaceAfter=2 * mm)))
        notes_text = Paragraph(_xml_text(report.get("notes", "")).replace('\n', '<br/>'), ParagraphStyle("notes", fontSize=8))
        notes_table = Table([[notes_text]], colWidths=[170 * mm])
        notes_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, LIGHT_GRAY),
            ('PADDING', (0,0), (-1,-1), 3*mm),
        ]))
        elements.append(notes_table)
        elements.append(Spacer(1, 5 * mm))

    # Financial Summary
    elements.append(Paragraph("FINANCIAL SUMMARY", ParagraphStyle("s", fontSize=9, fontName="Helvetica-Bold", textColor=NAVY, spaceAfter=2 * mm)))
    totals = campaign.get("totals", {})
    discount = campaign.get("discount", {})
    totals_data = [["Subtotal", f"KSh {_money(totals.get('subtotal'))}"]]
    if discount.get("status") == "approved":
        totals_data.append([
            f"Discount ({_number(discount.get('percentage')):g}%)",
            f"- KSh {_money(totals.get('discountValue'))}",
        ])
    totals_data.append(["VAT (16%)", f"KSh {_money(totals.get('vatAmount'))}"])
    totals_data.append(["GRAND TOTAL", f"KSh {_money(totals.get('grandTotal'))}"])
    totals_table = Table(totals_data, colWidths=[130 * mm, 40 * mm])
    totals_table.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, -1), (-1, -1), NAVY),
        ("BACKGROUND", (0, -1), (-1, -1), OFF_WHITE),
        ("PADDING", (0, 0), (-1, -1), 2.5 * mm),
        ("LINEABOVE", (0, -1), (-1, -1), 1, GOLD),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 8 * mm))

    # Footer
    elements.append(HRFlowable(width="100%", thickness=1, color=LIGHT_GRAY))
    elements.append(Paragraph(
        '<font color="#1A3E6F" size="7">'
        f'KBC Digital Division - Internal Document - {_xml_text(campaign.get("dabRef", ""))} - '
        f'Generated {datetime.now().strftime("%d %B %Y %H:%M")} - '
        'This document is for internal reporting purposes only.</font>',
        ParagraphStyle("footer", fontSize=7, alignment=TA_CENTER, spaceBefore=2 * mm),
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()
>>>>>>> 550d6fa3acb4bfbaea0f3c5dd8d8658bb7e0fa11
