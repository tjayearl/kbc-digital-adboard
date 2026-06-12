import firebase_admin
from firebase_admin import credentials, auth, firestore
from datetime import datetime, timezone

# Load credentials
cred = credentials.Certificate("serviceAccountKey.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

def seed_users():
    print("🧹 Cleaning up existing users...")
    
    # 1. Delete all users from Firebase Authentication
    try:
        users_page = auth.list_users()
        uids_to_delete = []
        while users_page:
            for user in users_page.users:
                uids_to_delete.append(user.uid)
            users_page = users_page.get_next_page()
            
        if uids_to_delete:
            delete_result = auth.delete_users(uids_to_delete)
            print(f"✅ Deleted {delete_result.success_count} users from Firebase Auth.")
            if delete_result.failure_count > 0:
                print(f"❌ Failed to delete {delete_result.failure_count} users.")
        else:
            print("No users found in Firebase Auth.")
    except Exception as e:
        print(f"Error listing/deleting users in Firebase Auth: {e}")

    # 2. Delete all users from Firestore 'users' collection
    try:
        user_docs = db.collection("users").stream()
        deleted_count = 0
        for doc in user_docs:
            doc.reference.delete()
            deleted_count += 1
        print(f"✅ Deleted {deleted_count} user documents from Firestore.")
    except Exception as e:
        print(f"Error deleting user documents from Firestore: {e}")

    # 3. Create the hardcoded Admin user
    admin_email = "admin@kbc.com"
    admin_password = "Admin1234"
    admin_name = "System Admin"
    admin_role = "admin"

    try:
        print(f"👤 Creating Admin user: {admin_email}...")
        # Create user in Firebase Auth
        firebase_user = auth.create_user(
            email=admin_email,
            password=admin_password,
            display_name=admin_name
        )
        
        # Set Admin Role claim
        auth.set_custom_user_claims(firebase_user.uid, {"role": admin_role})
        print(f"✅ Set custom claim 'role': 'admin' for {admin_email}")

        # Save to Firestore users collection
        db.collection("users").document(firebase_user.uid).set({
            "uid": firebase_user.uid,
            "name": admin_name,
            "email": admin_email,
            "role": admin_role,
            "phone": "",
            "active": True,
            "createdAt": datetime.now(timezone.utc).isoformat()
        })
        print(f"✅ Created admin user document in Firestore for {admin_email}")
        print("\n🎉 Seeding of Admin user completed successfully!")
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")

if __name__ == "__main__":
    seed_users()
