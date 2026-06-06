import firebase_admin
from firebase_admin import credentials, firestore
import uuid
from datetime import datetime, timezone

cred = credentials.Certificate("serviceAccountKey.json")

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

rate_card_items = [
    # --- 1. SOCIAL MEDIA SPONSORED CONTENT ---
    {"category": "Social Media Sponsored Content", "name": "Facebook Sponsored Post", "platform": "Facebook", "unit": "per post", "unitPrice": 23000},
    {"category": "Social Media Sponsored Content", "name": "Instagram Sponsored Post", "platform": "Instagram", "unit": "per post", "unitPrice": 23000},
    {"category": "Social Media Sponsored Content", "name": "X (Twitter) Sponsored Post", "platform": "X (Twitter)", "unit": "per post", "unitPrice": 23000},
    {"category": "Social Media Sponsored Content", "name": "TikTok Sponsored Post", "platform": "TikTok", "unit": "per post", "unitPrice": 23000},

    # --- 2. LIVESTREAM ---
    {"category": "Livestream", "name": "KBC Website / App Stream + 1 Article", "platform": "KBC Website / App", "unit": "per hour", "unitPrice": 150000},
    {"category": "Livestream", "name": "Stream + 1 Article", "platform": "Website / YouTube / Facebook", "unit": "per hour", "unitPrice": 200000},
    {"category": "Livestream", "name": "Stream + 8 SM Posts", "platform": "Website / YouTube / Facebook", "unit": "per hour", "unitPrice": 300000},
    {"category": "Livestream", "name": "Stream + 8 SM Posts + 1 Article", "platform": "Website / YouTube / Facebook", "unit": "per hour", "unitPrice": 350000},

    # --- 3. RICH MEDIA ADVERTISING ---
    {"category": "Rich Media Advertising", "name": "Roadblock", "platform": "Desktop / Mobile", "unit": "per hour", "unitPrice": 100000},
    {"category": "Rich Media Advertising", "name": "Skin Branding", "platform": "Desktop / Mobile", "unit": "per hour", "unitPrice": 100000},
    {"category": "Rich Media Advertising", "name": "Overlay", "platform": "Desktop / Mobile", "unit": "per hour", "unitPrice": 100000},
    {"category": "Rich Media Advertising", "name": "Expandable Ad", "platform": "Desktop / Mobile", "unit": "per hour", "unitPrice": 100000},
    {"category": "Rich Media Advertising", "name": "Skin Peel Ad", "platform": "Desktop / Mobile", "unit": "per hour", "unitPrice": 100000},
    {"category": "Rich Media Advertising", "name": "Side Kick", "platform": "Desktop / Mobile", "unit": "per hour", "unitPrice": 100000},
    {"category": "Rich Media Advertising", "name": "Video Banner", "platform": "Desktop / Mobile", "unit": "per hour", "unitPrice": 100000},

    # --- 4. BULK SMS ---
    {"category": "Bulk SMS Alerts", "name": "Bulk SMS - Up to 50K Users", "platform": "SMS", "unit": "per SMS", "unitPrice": 4},

    # --- 5. VIDEO PRODUCTION (ANIMATED) ---
    {"category": "Video Production (Animated)", "name": "Animated Video 2-5 Seconds", "platform": "Digital", "unit": "per video", "unitPrice": 127400},
    {"category": "Video Production (Animated)", "name": "Animated Video 6-15 Seconds", "platform": "Digital", "unit": "per video", "unitPrice": 153400},
    {"category": "Video Production (Animated)", "name": "Animated Video 16-30 Seconds", "platform": "Digital", "unit": "per video", "unitPrice": 169000},

    # --- 6. VIDEO PRODUCTION (STILL GRAPHIC) ---
    {"category": "Video Production (Still Graphic)", "name": "Still Graphic Video 2-5 Seconds", "platform": "Digital", "unit": "per video", "unitPrice": 80000},
    {"category": "Video Production (Still Graphic)", "name": "Still Graphic Video 6-15 Seconds", "platform": "Digital", "unit": "per video", "unitPrice": 110000},
    {"category": "Video Production (Still Graphic)", "name": "Still Graphic Video 16-30 Seconds", "platform": "Digital", "unit": "per video", "unitPrice": 140000},

    # --- 7. VIDEO INTERVIEW ---
    {"category": "Video Interview", "name": "Video Interview 1-3 Minutes", "platform": "Online", "unit": "per video", "unitPrice": 52000},

    # --- 8. ONLINE DOCUMENTARY ---
    {"category": "Online Documentary", "name": "Online Documentary 10-15 Minutes", "platform": "Online", "unit": "per documentary", "unitPrice": 500000},

    # --- 9. E-PAPER HOSTING ---
    {"category": "Online E-Paper Hosting", "name": "Weekly E-Paper Edition Hosting", "platform": "Publication Website", "unit": "per weekly edition", "unitPrice": 110500},

    # --- 10. DISPLAY BANNER (CPM) ---
    {"category": "Display Banner Advertising (CPM)", "name": "Leaderboard Banner 728x90 (CPM)", "platform": "KBC Website", "unit": "per 1000 impressions", "unitPrice": 117},
    {"category": "Display Banner Advertising (CPM)", "name": "Square Banner 300x250 (CPM)", "platform": "KBC Website", "unit": "per 1000 impressions", "unitPrice": 117},

    # --- 11. DISPLAY BANNER (TENANCY) ---
    {"category": "Display Banner Advertising (Tenancy)", "name": "Above the Fold Banner", "platform": "KBC Website", "unit": "per banner per day", "unitPrice": 5200},
    {"category": "Display Banner Advertising (Tenancy)", "name": "Below the Fold Banner", "platform": "KBC Website", "unit": "per banner per day", "unitPrice": 4550},

    # --- 12. E-PAPER SUBSCRIPTION ---
    {"category": "E-Paper Subscription", "name": "E-Paper 3 Month Subscription", "platform": "E-Paper", "unit": "per subscription", "unitPrice": 480},
    {"category": "E-Paper Subscription", "name": "E-Paper 6 Month Subscription", "platform": "E-Paper", "unit": "per subscription", "unitPrice": 720},
    {"category": "E-Paper Subscription", "name": "E-Paper 12 Month Subscription", "platform": "E-Paper", "unit": "per subscription", "unitPrice": 1200},

    # --- 13. SPONSORED CONTENT ---
    {"category": "Sponsored Content", "name": "Sponsored Article (Client Provided)", "platform": "KBC Website", "unit": "per article", "unitPrice": 57000},
    {"category": "Sponsored Content", "name": "Sponsored Article (Written by KBC)", "platform": "KBC Website", "unit": "per article", "unitPrice": 80000},

    # --- 14. LANDING PAGE ---
    {"category": "Landing Page Campaign", "name": "Landing Page Design", "platform": "KBC Website", "unit": "per landing page", "unitPrice": 117000},

    # --- 15. CREATIVE DEVELOPMENT ---
    {"category": "Creative Development", "name": "Banner Artwork Design", "platform": "Website / Mobile / Social Media", "unit": "per banner", "unitPrice": 15600},

    # --- 16. INFOGRAPHIC DESIGN ---
    {"category": "Infographic Design", "name": "Infographic Creative Generation", "platform": "Digital", "unit": "per creative", "unitPrice": 97500},

    # --- 17. EMAIL MARKETING ---
    {"category": "Email Marketing", "name": "Email Marketing Newsletter", "platform": "Email", "unit": "per email", "unitPrice": 84500},

    # --- 18. EMBEDDED VIDEO ADS ---
    {"category": "Embedded Video Ads", "name": "Embedded Video Ad 2-5 Seconds", "platform": "Video Channels", "unit": "per video", "unitPrice": 120000},
    {"category": "Embedded Video Ads", "name": "Embedded Video Ad 6-15 Seconds", "platform": "Video Channels", "unit": "per video", "unitPrice": 220000},
    {"category": "Embedded Video Ads", "name": "Embedded Video Ad 16-30 Seconds", "platform": "Video Channels", "unit": "per video", "unitPrice": 570000},

    # --- 19. E-PAPER ADVERTISING ---
    {"category": "E-Paper Advertising", "name": "Clickable Advert on E-Paper", "platform": "E-Paper", "unit": "per advert", "unitPrice": 169000},
    {"category": "E-Paper Advertising", "name": "Video Advert on E-Paper", "platform": "E-Paper", "unit": "per video", "unitPrice": 275000},
    {"category": "E-Paper Advertising", "name": "E-Paper Supplement Page", "platform": "E-Paper", "unit": "per page", "unitPrice": 50000},

    # --- 20. MOBILE APP ADVERTISING ---
    {"category": "Mobile App Advertising", "name": "Customised Advert on KBC App", "platform": "KBC App", "unit": "per advert per month", "unitPrice": 325000},
    {"category": "Mobile App Advertising", "name": "Full KBC App Sponsorship", "platform": "KBC App", "unit": "per month", "unitPrice": 487500},
    {"category": "Mobile App Advertising", "name": "Mobile App Push Notification", "platform": "KBC App", "unit": "per push notification", "unitPrice": 0.30},
    {"category": "Mobile App Advertising", "name": "App Video Advert 15 Seconds", "platform": "KBC App", "unit": "per video per month", "unitPrice": 275000},
    {"category": "Mobile App Advertising", "name": "App Video Advert 30 Seconds", "platform": "KBC App", "unit": "per video per month", "unitPrice": 495000},

    # --- 21. CONTENT SPONSORSHIP ---
    {"category": "Content Sponsorship", "name": "Content Sponsorship Desktop Category", "platform": "KBC Website", "unit": "per category", "unitPrice": 260000},

    # --- 22. IN-FEED ADVERTS ---
    {"category": "In-Feed Adverts", "name": "In-Feed Advert", "platform": "KBC Website", "unit": "per advert", "unitPrice": 20},

    # --- 23. VANITY LINKS ---
    {"category": "Vanity Links", "name": "Vanity Link", "platform": "Digital", "unit": "per vanity link", "unitPrice": 15000},

    # --- 24. VIDEO PRODUCT REVIEWS ---
    {"category": "Video Product Reviews", "name": "Video Product or Service Review", "platform": "Desktop / Mobile", "unit": "per video review", "unitPrice": 80000},

    # --- 25. MOBILE AUDIO ---
    {"category": "Mobile Audio Advertisement", "name": "Interactive Playback Ringtone with SMS", "platform": "Mobile", "unit": "per 20 sec play per user", "unitPrice": 7},

    # --- 26. SOCIAL MEDIA INFLUENCER ---
    {"category": "Social Media Influencer", "name": "Social Media Influencer Endorsement", "platform": "Social Media", "unit": "3 posts per week", "unitPrice": 350000},

    # --- 27. ONLINE ADVERTISING ---
    {"category": "Online Advertising", "name": "Google / Facebook / Instagram Ads - Pay Per Click", "platform": "Google / Facebook / Instagram", "unit": "per click", "unitPrice": 10},
    {"category": "Online Advertising", "name": "Google / Facebook / Instagram Ads - Monthly Management", "platform": "Google / Facebook / Instagram", "unit": "per month", "unitPrice": 350000},
]

now = datetime.now(timezone.utc).isoformat()
success_count = 0

for item in rate_card_items:
    item_id = str(uuid.uuid4())
    db.collection("rateCard").document(item_id).set({
        **item,
        "version": 1,
        "updatedAt": now,
        "updatedBy": "system-seed-2024-2025"
    })
    print(f"✅ {item['category']} — {item['name']} @ KSh {item['unitPrice']:,}")
    success_count += 1

print(f"\n✅ Rate card seeded — {success_count} items loaded.")
print("📌 All rates exclude 16% VAT — applied at Order Sheet level.")