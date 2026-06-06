import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone

cred = credentials.Certificate("serviceAccountKey.json")

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Test serials — replace with real KBC Air-Time Order numbers when available
test_serials = [
    "ATO-2026-001",
    "ATO-2026-002",
    "ATO-2026-003",
    "ATO-2026-004",
    "ATO-2026-005",
]

now = datetime.now(timezone.utc).isoformat()

for serial in test_serials:
    db.collection("airtimeOrders").add({
        "serial": serial,
        "loadedBy": "system-seed",
        "loadedAt": now,
        "matched": False,
        "matchedAt": None
    })
    print(f"✅ Added serial: {serial}")

print("\n✅ Air-Time Order serials seeded successfully.")