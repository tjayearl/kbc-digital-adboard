import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone

# Load credentials
cred = credentials.Certificate("serviceAccountKey.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

rate_card_items = [
    {
        "id": "social-post",
        "category": "Social Media Sponsored Content",
        "name": "Social media sponsored post",
        "unit": "post / platform",
        "unitPrice": 23000,
        "platform": "Social Media"
    },
    {
        "id": "livestream-article",
        "category": "Livestream",
        "name": "Livestream + article",
        "unit": "hour",
        "unitPrice": 200000,
        "platform": "Website / YouTube / Facebook"
    },
    {
        "id": "livestream-social",
        "category": "Livestream",
        "name": "Livestream + 8 social posts",
        "unit": "hour",
        "unitPrice": 300000,
        "platform": "Website / YouTube / Facebook"
    },
    {
        "id": "livestream-full",
        "category": "Livestream",
        "name": "Livestream + posts + article",
        "unit": "hour",
        "unitPrice": 350000,
        "platform": "Website / YouTube / Facebook"
    },
    {
        "id": "display-above",
        "category": "Display Banner Advertising (Tenancy)",
        "name": "Display banner - above the fold",
        "unit": "day",
        "unitPrice": 5200,
        "platform": "KBC Website"
    },
    {
        "id": "display-below",
        "category": "Display Banner Advertising (Tenancy)",
        "name": "Display banner - below the fold",
        "unit": "day",
        "unitPrice": 4550,
        "platform": "KBC Website"
    },
    {
        "id": "rich-media",
        "category": "Rich Media Advertising",
        "name": "Rich media / roadblock / skin",
        "unit": "hour",
        "unitPrice": 100000,
        "platform": "Desktop / Mobile"
    },
    {
        "id": "article-client",
        "category": "Sponsored Content",
        "name": "Sponsored article - client copy",
        "unit": "article",
        "unitPrice": 74100,
        "platform": "KBC Website"
    },
    {
        "id": "article-kbc",
        "category": "Sponsored Content",
        "name": "Sponsored article - KBC writes",
        "unit": "article",
        "unitPrice": 104000,
        "platform": "KBC Website"
    },
    {
        "id": "app-ad",
        "category": "Mobile App Advertising",
        "name": "Custom in-app ad",
        "unit": "month",
        "unitPrice": 325000,
        "platform": "KBC App"
    },
    {
        "id": "push",
        "category": "Bulk SMS Alerts",
        "name": "App push notification",
        "unit": "send",
        "unitPrice": 0.3,
        "platform": "App Push"
    },
    {
        "id": "sms",
        "category": "Bulk SMS Alerts",
        "name": "Bulk SMS",
        "unit": "SMS",
        "unitPrice": 5,
        "platform": "SMS"
    },
    {
        "id": "landing-page",
        "category": "Landing Page Campaign",
        "name": "Landing page design",
        "unit": "page",
        "unitPrice": 117000,
        "platform": "KBC Website"
    },
    {
        "id": "animated-video",
        "category": "Video Production (Animated)",
        "name": "Animated video 16-30 sec",
        "unit": "video",
        "unitPrice": 169000,
        "platform": "Digital"
    }
]

def seed_rate_card():
    print("🧹 Cleaning up existing rate card items...")
    rate_docs = db.collection("rateCard").stream()
    deleted_count = 0
    for doc in rate_docs:
        doc.reference.delete()
        deleted_count += 1
    print(f"✅ Deleted {deleted_count} rate card items from Firestore.")

    print("🌱 Seeding rate card...")
    now = datetime.now(timezone.utc).isoformat()
    success_count = 0

    for item in rate_card_items:
        item_id = item["id"]
        # Save without 'id' key as it becomes the document ID
        data = {k: v for k, v in item.items() if k != "id"}
        db.collection("rateCard").document(item_id).set({
            **data,
            "version": 1,
            "updatedAt": now,
            "updatedBy": "system-seed-2026",
            "status": "Active"
        })
        print(f"✅ {item['category']} — {item['name']} @ KSh {item['unitPrice']:,}")
        success_count += 1

    print(f"\n✅ Rate card seeded — {success_count} items loaded.")
    print("All rates exclude 16% VAT — applied at Order Sheet level.")

if __name__ == "__main__":
    seed_rate_card()