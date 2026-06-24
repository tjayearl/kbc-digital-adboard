import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
from reportlab.lib import colors


def generate_order_sheet_pdf(campaign: dict) -> bytes:
    # This is a placeholder for the existing order sheet generation
    # to keep the file structure consistent.
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = [Paragraph("Order Sheet PDF", styles['h1'])]
    story.append(Paragraph(f"Campaign: {campaign.get('name', 'N/A')}", styles['body']))
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

def generate_campaign_report_pdf(campaign: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    styles.add(ParagraphStyle(name='Right', alignment=TA_RIGHT))
    styles.add(ParagraphStyle(name='Center', alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='SectionHeader', fontSize=14, fontName='Helvetica-Bold', spaceBefore=12, spaceAfter=6))
    styles.add(ParagraphStyle(name='SubHeader', fontSize=10, fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=2))
    styles.add(ParagraphStyle(name='Justify', alignment=1, leading=14))

    story = []

    # Header
    # In a real scenario, you'd use a path to a logo file.
    # logo = "path/to/kbc_logo.png"
    # story.append(Image(logo, width=100, height=50))
    story.append(Paragraph("KBC Digital AdBoard", styles['h1']))
    story.append(Paragraph("Campaign Performance Report", styles['h2']))
    story.append(Spacer(1, 24))

    # Report Info
    report_date = datetime.now().strftime("%d %B %Y, %H:%M")
    story.append(Paragraph(f"<b>Report Generated:</b> {report_date}", styles['Normal']))
    story.append(Paragraph(f"<b>DAB Reference:</b> {campaign.get('dabRef', 'N/A')}", styles['Normal']))
    story.append(Spacer(1, 12))

    # --- Campaign Details ---
    story.append(Paragraph("Campaign Details", styles['SectionHeader']))
    
    campaign_details_data = [
        ['Campaign Name:', campaign.get('name', 'N/A')],
        ['Objective:', campaign.get('objective', 'N/A')],
        ['Status:', campaign.get('status', 'N/A').replace('briefUnlocked', 'Brief Unlocked')],
        ['Flight Dates:', f"{campaign.get('startDate', 'N/A')} to {campaign.get('endDate', 'N/A')}"]
    ]
    
    t_camp = Table(campaign_details_data, colWidths=[120, None])
    t_camp.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
        ('GRID', (0,0), (-1,-1), 1, colors.lightgrey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_camp)
    story.append(Spacer(1, 12))

    # --- Client Details ---
    story.append(Paragraph("Client Details", styles['SectionHeader']))
    client_details_data = [
        ['Company:', campaign.get('clientCompany', 'N/A')],
        ['Contact:', f"{campaign.get('clientName', 'N/A')} ({campaign.get('clientEmail', 'N/A')})"],
    ]
    t_client = Table(client_details_data, colWidths=[120, None])
    t_client.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
        ('GRID', (0,0), (-1,-1), 1, colors.lightgrey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_client)
    story.append(Spacer(1, 24))

    # --- Products & Services ---
    story.append(Paragraph("Booked Products & Services", styles['SectionHeader']))
    
    products_data = [['Product Name', 'Quantity', 'Unit', 'Unit Price', 'Total Price']]
    totals = campaign.get('totals', {})
    
    for item in campaign.get('products', []):
        products_data.append([
            Paragraph(item.get('name', 'N/A'), styles['Normal']),
            item.get('quantity', 0),
            item.get('unit', 'N/A'),
            f"Ksh {item.get('unitPrice', 0):,.2f}",
            f"Ksh {item.get('quantity', 0) * item.get('unitPrice', 0):,.2f}"
        ])

    t_prod = Table(products_data, colWidths=[None, 60, 80, 80, 80])
    t_prod.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1A3E6F")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))
    story.append(t_prod)
    story.append(Spacer(1, 12))

    # --- Financial Summary ---
    story.append(Paragraph("Financial Summary", styles['SectionHeader']))
    
    financial_data = [
        ['Subtotal:', f"Ksh {totals.get('subtotal', 0):,.2f}"],
        ['Discount:', f"- Ksh {totals.get('discountValue', 0):,.2f}"],
        ['VAT (16%):', f"Ksh {totals.get('vatAmount', 0):,.2f}"],
        [Paragraph('<b>Grand Total:</b>', styles['Normal']), Paragraph(f"<b>Ksh {totals.get('grandTotal', 0):,.2f}</b>", styles['Normal'])]
    ]
    
    t_fin = Table(financial_data, colWidths=[None, 120])
    t_fin.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
        ('TOPPADDING', (0, -1), (-1, -1), 6),
    ]))
    story.append(t_fin)

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes