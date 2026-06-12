import sys
import os

# Set python path to backend root
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("🚀 Starting Master Database Seeding...")
print("========================================")

try:
    print("\n--- 1. Seeding Users ---")
    import seed_users
    seed_users.seed_users()
except Exception as e:
    print(f"Error running seed_users: {e}")

try:
    print("\n--- 2. Seeding Rate Card ---")
    import seed_rate_card
except Exception as e:
    print(f"Error running seed_rate_card: {e}")

try:
    print("\n--- 3. Seeding Air-Time Orders ---")
    import seed_airtime_orders
except Exception as e:
    print(f"Error running seed_airtime_orders: {e}")

print("\n========================================")
print("✅ Database seeding completed!")
