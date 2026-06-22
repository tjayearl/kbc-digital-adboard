import unittest

from app.services.pdf_service import generate_order_sheet_pdf


class PdfServiceTests(unittest.TestCase):
    def test_generate_order_sheet_pdf_accepts_firestore_like_values(self):
        campaign = {
            "dabRef": "DAB-2026-00001",
            "client": {
                "name": None,
                "company": "Acme Ltd",
                "contact": "Jane <Doe>",
                "email": "jane@example.com",
                "phone": "+254700000000",
            },
            "campaign": {
                "name": "Launch",
                "startDate": "2026-06-17",
                "endDate": "2026-06-20",
                "flightDays": "4",
            },
            "lineItems": [{
                "productName": "Facebook Sponsored Post",
                "platform": None,
                "quantity": "2",
                "postsPerDay": None,
                "unitPrice": "23,000",
                "totalPrice": None,
            }],
            "boosting": {
                "required": True,
                "platforms": None,
                "budget": "5000",
                "isOnTopOfOrder": True,
            },
            "discount": {
                "status": "approved",
                "percentage": "10",
                "approvedBy": None,
            },
            "totals": {
                "subtotal": "46000",
                "discountValue": None,
                "vatAmount": "6624",
                "grandTotal": "48024",
            },
        }

        pdf = generate_order_sheet_pdf(campaign)

        self.assertGreater(len(pdf), 0)
        self.assertEqual(pdf[:5], b"%PDF-")


if __name__ == "__main__":
    unittest.main()
