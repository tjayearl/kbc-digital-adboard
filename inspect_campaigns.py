import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize firebase admin
if not firebase_admin._apps:
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "backend/serviceAccountKey.json")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

campaigns = db.collection("campaigns").stream()
print("Campaigns in Firestore:")
for c in campaigns:
    data = c.to_dict()
    print(f"ID: {c.id}")
    print(f"  Name: {data.get('name')}")
    print(f"  Status: {data.get('status')}")
    print(f"  orderSheetPdfUrl: {data.get('orderSheetPdfUrl')}")
    print(f"  createdBy: {data.get('createdBy')}")
    print("---------------------------------")
