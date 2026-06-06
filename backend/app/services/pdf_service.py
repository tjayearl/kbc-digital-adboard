from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
import io
from datetime import datetime

NAVY = colors.HexColor("#1A3E6F")
GOLD = colors.HexColor("#C8972B")
TEAL = colors.HexColor("#0F6E56")
OFF_WHITE = colors.HexColor("#F7F7F7")
LIGHT_GRAY = colors.HexColor("#E5E7EB")

def generate_order_sheet_pdf(campaign: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=15*mm, bottomMargin=15*mm)
    elements = []

    header_data = [[
        Paragraph('<font color="#1A3E6F"><b>KBC</b></font> <font color="#C8972B">Digital Division</font>', ParagraphStyle('h', fontSize=20, fontName='Helvetica-Bold')),
        Paragraph(f'<font color="#1A3E6F"><b>DIGITAL ADBOARD ORDER SHEET</b></font><br/><font color="#C8972B" size="10">{campaign.get("dabRef", "")}</font>', ParagraphStyle('ref', fontSize=8, alignment=TA_RIGHT))
    ]]
    header_table = Table(header_data, colWidths=[100*mm, 70*mm])
    header_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('BOTTOMPADDING', (0,0), (-1,-1), 4*mm)]))
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", thickness=2, color=NAVY))
    elements.append(Spacer(1, 5*mm))

    client = campaign.get("client", {})
    campaign_info = campaign.get("campaign", {})
    client_data = [
        ["CLIENT DETAILS", "CAMPAIGN DETAILS"],
        [f"Name: {client.get('name','')}\nCompany: {client.get('company','')}\nContact: {client.get('contact','')}\nEmail: {client.get('email','')}\nPhone: {client.get('phone','')}",
         f"Campaign: {campaign_info.get('name','')}\nStart: {campaign_info.get('startDate','')}\nEnd: {campaign_info.get('endDate','')}\nFlight Days: {campaign_info.get('flightDays','')} days"]
    ]
    client_table = Table(client_data, colWidths=[85*mm, 85*mm])
    client_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY), ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'), ('FONTSIZE', (0,0), (-1,-1), 8),
        ('PADDING', (0,0), (-1,-1), 3*mm), ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, LIGHT_GRAY), ('BACKGROUND', (0,1), (-1,-1), OFF_WHITE),
    ]))
    elements.append(client_table)
    elements.append(Spacer(1, 5*mm))

    elements.append(Paragraph("CAMPAIGN LINE ITEMS", ParagraphStyle('s', fontSize=9, fontName='Helvetica-Bold', textColor=NAVY, spaceAfter=2*mm)))
    line_items = campaign.get("lineItems", [])
    item_data = [["Product", "Platform", "Qty", "Posts/Day", "Unit Price (KSh)", "Total (KSh)"]]
    for item in line_items:
        item_data.append([item.get("productName",""), item.get("platform",""), str(item.get("quantity",0)), str(item.get("postsPerDay",0)), f"{item.get('unitPrice',0):,.2f}", f"{item.get('totalPrice',0):,.2f}"])
    item_table = Table(item_data, colWidths=[40*mm, 30*mm, 15*mm, 20*mm, 30*mm, 30*mm])
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY), ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'), ('FONTSIZE', (0,0), (-1,-1), 8),
        ('ALIGN', (2,0), (-1,-1), 'RIGHT'), ('PADDING', (0,0), (-1,-1), 2.5*mm),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, OFF_WHITE]), ('GRID', (0,0), (-1,-1), 0.5, LIGHT_GRAY),
    ]))
    elements.append(item_table)
    elements.append(Spacer(1, 4*mm))

    boosting = campaign.get("boosting", {})
    if boosting.get("required"):
        platforms = ", ".join(boosting.get("platforms", []))
        budget = boosting.get("budget", 0)
        on_top = "ON TOP OF ORDER VALUE" if boosting.get("isOnTopOfOrder") else "INCLUDED IN ORDER VALUE"
        boosting_label = f"{platforms} | KSh {budget:,.2f} | {on_top}"
    else:
        boosting_label = "NIL"
    boost_table = Table([["BOOSTING", boosting_label]], colWidths=[40*mm, 130*mm])
    boost_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), TEAL), ('TEXTCOLOR', (0,0), (0,0), colors.white),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'), ('FONTSIZE', (0,0), (-1,-1), 8),
        ('PADDING', (0,0), (-1,-1), 2.5*mm), ('GRID', (0,0), (-1,-1), 0.5, LIGHT_GRAY),
    ]))
    elements.append(boost_table)
    elements.append(Spacer(1, 4*mm))

    totals = campaign.get("totals", {})
    discount = campaign.get("discount", {})
    totals_data = [["Subtotal", f"KSh {totals.get('subtotal',0):,.2f}"]]
    if discount.get("status") == "approved":
        totals_data.append([f"Discount ({discount.get('percentage',0)}%) — Approved by {discount.get('approvedBy','')}", f"- KSh {totals.get('discountValue',0):,.2f}"])
    totals_data.append(["VAT (16%)", f"KSh {totals.get('vatAmount',0):,.2f}"])
    totals_data.append(["GRAND TOTAL", f"KSh {totals.get('grandTotal',0):,.2f}"])
    totals_table = Table(totals_data, colWidths=[130*mm, 40*mm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (1,0), (1,-1), 'RIGHT'), ('FONTSIZE', (0,0), (-1,-1), 8),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'), ('TEXTCOLOR', (0,-1), (-1,-1), NAVY),
        ('BACKGROUND', (0,-1), (-1,-1), OFF_WHITE), ('PADDING', (0,0), (-1,-1), 2.5*mm),
        ('LINEABOVE', (0,-1), (-1,-1), 1, GOLD),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 8*mm))

    sig_data = [[
        Paragraph(f"Client Signature & Stamp<br/><br/><br/><br/>____________________________<br/>Name: {client.get('contact','')}<br/>Date: ___________________", ParagraphStyle('sig', fontSize=8)),
        Paragraph("Advertising Manager<br/><br/><br/><br/>____________________________<br/>Name: ___________________<br/>Date: ___________________", ParagraphStyle('sig', fontSize=8))
    ]]
    sig_table = Table(sig_data, colWidths=[85*mm, 85*mm])
    sig_table.setStyle(TableStyle([('GRID', (0,0), (-1,-1), 0.5, LIGHT_GRAY), ('PADDING', (0,0), (-1,-1), 4*mm), ('VALIGN', (0,0), (-1,-1), 'TOP')]))
    elements.append(sig_table)
    elements.append(Spacer(1, 5*mm))

    elements.append(HRFlowable(width="100%", thickness=1, color=LIGHT_GRAY))
    elements.append(Paragraph(f'<font color="#1A3E6F" size="7">KBC Digital Division — Internal Document — {campaign.get("dabRef","")} — Generated {datetime.now().strftime("%d %B %Y %H:%M")} — This document is locked and non-editable</font>', ParagraphStyle('footer', fontSize=7, alignment=TA_CENTER, spaceBefore=2*mm)))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()